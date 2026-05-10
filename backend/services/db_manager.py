import os
import json
import sqlite3
import asyncio
import logging
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

logger = logging.getLogger(__name__)

class SQLiteCollection:
    def __init__(self, db_path: str, table_name: str):
        self.db_path = db_path
        self.table_name = table_name
        self._init_table()

    def _init_table(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {self.table_name} (id TEXT PRIMARY KEY, data TEXT)")
            conn.commit()

    def _serialize(self, doc):
        if not doc: return None
        new_doc = doc.copy()
        if "_id" in new_doc and isinstance(new_doc["_id"], ObjectId):
            new_doc["_id"] = str(new_doc["_id"])
        return json.dumps(new_doc)

    def _deserialize(self, data):
        if not data: return None
        return json.loads(data)

    async def insert_one(self, document: Dict[str, Any]):
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        doc_id = str(document["_id"])
        data_str = self._serialize(document)
        
        def _run():
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(f"INSERT OR REPLACE INTO {self.table_name} (id, data) VALUES (?, ?)", (doc_id, data_str))
                conn.commit()
            return type('InsertResult', (), {'inserted_id': doc_id})()
        
        return await asyncio.to_thread(_run)

    async def find_one(self, filter: Dict[str, Any]):
        def _run():
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(f"SELECT data FROM {self.table_name}")
                rows = cursor.fetchall()
                for (data_str,) in rows:
                    doc = self._deserialize(data_str)
                    
                    def check_match(f, d):
                        if "$or" in f:
                            return any(check_match(cond, d) for cond in f["$or"])
                        if "$and" in f:
                            return all(check_match(cond, d) for cond in f["$and"])
                        
                        for k, v in f.items():
                            if k.startswith("$"): continue
                            # Handle nested or special logic if needed
                            val = d.get(k)
                            if k == "_id" and isinstance(v, (ObjectId, str)):
                                if str(val) != str(v): return False
                            elif val != v:
                                return False
                        return True

                    if check_match(filter, doc):
                        return doc
            return None
        return await asyncio.to_thread(_run)

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        doc = await self.find_one(filter)
        if not doc:
            if upsert:
                # Basic upsert
                new_doc = filter.copy()
                if "$set" in update: new_doc.update(update["$set"])
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        new_doc[k] = new_doc.get(k, 0) + v
                return await self.insert_one(new_doc)
            return type('UpdateResult', (), {'modified_count': 0})()

        # Apply updates
        if "$set" in update:
            doc.update(update["$set"])
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v
        
        return await self.insert_one(doc)

    def find(self, filter: Dict[str, Any] = None):
        # Returns a cursor-like object
        return SQLiteCursor(self.db_path, self.table_name, filter or {})

    async def count_documents(self, filter: Dict[str, Any]):
        cursor = self.find(filter)
        results = await cursor.to_list(length=10000)
        return len(results)

class SQLiteCursor:
    def __init__(self, db_path: str, table_name: str, filter: Dict[str, Any]):
        self.db_path = db_path
        self.table_name = table_name
        self.filter = filter
        self._sort = None
        self._limit = None

    def sort(self, key, direction=1):
        self._sort = (key, direction)
        return self

    def limit(self, n):
        self._limit = n
        return self

    async def to_list(self, length: int):
        def _run():
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(f"SELECT data FROM {self.table_name}")
                rows = cursor.fetchall()
                results = []
                
                def check_match(f, d):
                    if "$or" in f:
                        return any(check_match(cond, d) for cond in f["$or"])
                    if "$and" in f:
                        return all(check_match(cond, d) for cond in f["$and"])
                    for k, v in f.items():
                        if k.startswith("$"): continue
                        val = d.get(k)
                        if k == "_id" and isinstance(v, (ObjectId, str)):
                            if str(val) != str(v): return False
                        elif val != v:
                            return False
                    return True

                for (data_str,) in rows:
                    doc = json.loads(data_str)
                    if check_match(self.filter, doc):
                        results.append(doc)
                
                # Sorting
                if self._sort:
                    key, direction = self._sort
                    results.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
                
                # Limit
                if self._limit:
                    results = results[:self._limit]
                else:
                    results = results[:length]
                
                return results
        return await asyncio.to_thread(_run)

class DBManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.mode = "initializing"
        self.sqlite_path = "clarion_local.db"
        self.collections = {}

    async def connect(self, mongo_url: str, local_mongo_url: str):
        # 1. Try Primary MongoDB
        try:
            logger.info(f"Attempting MongoDB Atlas connection...")
            self.client = AsyncIOMotorClient(
                mongo_url,
                tlsCAFile=certifi.where(),
                tls=True,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=3000,
            )
            await self.client.admin.command('ping')
            self.db = self.client["clarion_db"]
            self.mode = "production"
            logger.info("✅ Connected to MongoDB Atlas.")
            return
        except Exception as e:
            logger.warning(f"MongoDB Atlas failed: {e}")

        # 2. Try Local MongoDB
        try:
            logger.info(f"Attempting Local MongoDB connection...")
            self.client = AsyncIOMotorClient(
                local_mongo_url,
                serverSelectionTimeoutMS=2000,
            )
            await self.client.admin.command('ping')
            self.db = self.client["clarion_db"]
            self.mode = "local_mongo"
            logger.info("✅ Connected to Local MongoDB.")
            return
        except Exception as e:
            logger.warning(f"Local MongoDB failed: {e}")

        # 3. Fallback to SQLite
        logger.warning("⚠️ Entering SQLite Fallback Mode (Full Dynamic Support).")
        self.mode = "sqlite"
        self.db = self # We act as the db object for collection access

    def __getitem__(self, name):
        if self.mode != "sqlite":
            return self.db[name]
        
        if name not in self.collections:
            self.collections[name] = SQLiteCollection(self.sqlite_path, name)
        return self.collections[name]

    def __getattr__(self, name):
        # Allow db_manager.collection_name
        return self[name]

    @property
    def status(self):
        return "connected" if self.mode != "sqlite" else "sqlite_fallback"

db_manager = DBManager()
