# backend/services/concept_graph.py
import json
import os
import logging

logger = logging.getLogger(__name__)

class ConceptGraph:
    def __init__(self, data_path="data/concept_graph.json"):
        self.data_path = data_path
        self.graph = {}
        self.load_graph()

    def load_graph(self):
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, "r") as f:
                    self.graph = json.load(f)
            except Exception as e:
                logger.error(f"Error loading concept graph: {e}")
                self.graph = self._get_default_graph()
        else:
            self.graph = self._get_default_graph()
            self.save_graph()

    def save_graph(self):
        try:
            os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
            with open(self.data_path, "w") as f:
                json.dump(self.graph, f, indent=4)
        except Exception as e:
            logger.error(f"Error saving concept graph: {e}")

    def _get_default_graph(self):
        """Initial high-quality technical knowledge base."""
        return {
            "React": {
                "concepts": {
                    "Hooks": {
                        "requires": ["State", "Functional Components"],
                        "advanced": ["Custom Hooks", "Memoization", "Cleanup Functions"],
                        "common_mistakes": ["Hooks in loops", "Hooks in conditionals"],
                        "opposites": ["Class Components Lifecycle"]
                    },
                    "Virtual DOM": {
                        "requires": ["DOM", "Reconciliation"],
                        "advanced": ["Fiber Architecture", "Diffing Algorithm"],
                        "common_mistakes": ["Direct DOM manipulation"],
                        "opposites": ["Real DOM updates"]
                    },
                    "State": {
                        "requires": ["Data Flow"],
                        "advanced": ["Context API", "State Management Libraries"],
                        "common_mistakes": ["Mutating state directly"],
                        "opposites": ["Props (immutable)"]
                    }
                }
            },
            "DSA": {
                "concepts": {
                    "Time Complexity": {
                        "requires": ["Algorithms", "Operations Count"],
                        "advanced": ["Amortized Analysis", "Space-Time Tradeoff"],
                        "common_mistakes": ["Ignoring nested loops", "Confusing O(n) with O(log n)"],
                        "opposites": ["Constant Time O(1)"]
                    },
                    "Recursion": {
                        "requires": ["Stack Frame", "Base Case"],
                        "advanced": ["Tail Call Optimization", "Dynamic Programming"],
                        "common_mistakes": ["Infinite recursion", "Missing base case"],
                        "opposites": ["Iteration"]
                    }
                }
            },
            "System Design": {
                "concepts": {
                    "Load Balancing": {
                        "requires": ["Servers", "Traffic Management"],
                        "advanced": ["Sticky Sessions", "Weighted Round Robin"],
                        "common_mistakes": ["Single point of failure"],
                        "opposites": ["Single Server"]
                    },
                    "Caching": {
                        "requires": ["Latency", "Storage"],
                        "advanced": ["Cache Eviction Policies", "Write-through/Write-back"],
                        "common_mistakes": ["Cache stampede", "Stale data"],
                        "opposites": ["Database Disk Read"]
                    }
                }
            }
        }

    def get_related_info(self, domain, concept_name):
        domain_data = self.graph.get(domain, {})
        return domain_data.get("concepts", {}).get(concept_name, {})

# Singleton instance
concept_graph_service = ConceptGraph()

def get_related_concepts(topic, missing, understood):
    """Compatibility wrapper for analyze.py"""
    # Simply return placeholders for now as the graph is static/demo
    return {
        "related_concepts": [],
        "missing_prerequisites": [],
        "next_learning_path": ["Deep dive into " + topic]
    }
