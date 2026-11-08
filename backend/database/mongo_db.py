"""
SolarIQ MongoDB Persistence Engine
Connects to MongoDB (solariq_db) using PyMongo.
Includes automatic zero-downtime local JSON file fallback (data/mongo_fallback.json)
if MongoDB service is not running locally.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

try:
    import pymongo
    from pymongo.errors import ServerSelectionTimeoutError
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/"
DB_NAME = os.getenv("MONGO_DATABASE") or os.getenv("MONGODB_DATABASE") or "solariq_db"
FALLBACK_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mongo_fallback.json")

class SolarIQDatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.use_mongo = False
        self._init_connection()

    def _init_connection(self):
        if HAS_PYMONGO:
            try:
                self.client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
                self.client.admin.command('ping')
                self.db = self.client[DB_NAME]
                self.use_mongo = True
                print(f"[SolarIQ DB] Connected to MongoDB database: {DB_NAME}")
                self._ensure_indexes()
                return
            except Exception as e:
                print(f"[SolarIQ DB] MongoDB ping failed ({e}). Using zero-downtime JSON fallback.")

        self.use_mongo = False
        self._init_fallback_file()

    def _ensure_indexes(self):
        """Creates necessary indexes on MongoDB collections."""
        if self.use_mongo and self.db is not None:
            try:
                self.db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
                self.db.history.create_index([("user_email", pymongo.ASCENDING), ("timestamp", pymongo.DESCENDING)])
                self.db.scenarios.create_index([("user_email", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
                self.db.location_preferences.create_index([("user_email", pymongo.ASCENDING)], unique=True)
                self.db.activity_logs.create_index([("user_email", pymongo.ASCENDING), ("timestamp", pymongo.DESCENDING)])
                self.db.reports.create_index([("user_email", pymongo.ASCENDING), ("timestamp", pymongo.DESCENDING)])
                self.db.email_otps.create_index([("email", pymongo.ASCENDING)])
                self.db.email_otps.create_index([("expires_at", pymongo.ASCENDING)], expireAfterSeconds=0)
            except Exception as idx_err:
                print(f"[SolarIQ DB Indexing Warning] {idx_err}")

    def _init_fallback_file(self):
        os.makedirs(os.path.dirname(FALLBACK_PATH), exist_ok=True)
        if not os.path.exists(FALLBACK_PATH):
            with open(FALLBACK_PATH, "w") as f:
                json.dump({
                    "users": [], 
                    "history": [], 
                    "scenarios": [], 
                    "location_preferences": [], 
                    "activity_logs": [], 
                    "reports": [],
                    "email_otps": []
                }, f, indent=2)

    def _read_fallback(self) -> Dict[str, List[Any]]:
        try:
            with open(FALLBACK_PATH, "r") as f:
                data = json.load(f)
                data.setdefault("users", [])
                data.setdefault("history", [])
                data.setdefault("scenarios", [])
                data.setdefault("location_preferences", [])
                data.setdefault("activity_logs", [])
                data.setdefault("reports", [])
                data.setdefault("email_otps", [])
                return data
        except Exception:
            return {
                "users": [], 
                "history": [], 
                "scenarios": [], 
                "location_preferences": [], 
                "activity_logs": [], 
                "reports": [],
                "email_otps": []
            }

    def _write_fallback(self, data: Dict[str, List[Any]]):
        try:
            os.makedirs(os.path.dirname(FALLBACK_PATH), exist_ok=True)
            with open(FALLBACK_PATH, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[SolarIQ DB Error] Failed writing fallback file: {e}")

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email address."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                user = self.db.users.find_one({"email": clean_email}, {"_id": 0})
                if user:
                    return user
            except Exception as e:
                print(f"[SolarIQ DB] Mongo user lookup failed ({e}), using fallback.")

        store = self._read_fallback()
        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                return u
        return None

    def save_user(self, user_doc: Dict[str, Any]) -> bool:
        """Saves a new user document."""
        user_copy = dict(user_doc)
        user_copy["email"] = user_copy["email"].strip().lower()
        user_copy["created_at"] = user_copy.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        user_copy["last_login"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user_copy["status"] = user_copy.get("status", "active")
        user_copy["location"] = user_copy.get("location", "Standard Installation Site")

        if self.use_mongo and self.db is not None:
            try:
                self.db.users.update_one({"email": user_copy["email"]}, {"$set": user_copy}, upsert=True)
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo save user failed ({e}), using fallback.")

        store = self._read_fallback()
        users = store.get("users", [])
        existing_idx = next((i for i, u in enumerate(users) if u.get("email", "").lower() == user_copy["email"]), -1)
        if existing_idx >= 0:
            users[existing_idx] = user_copy
        else:
            users.append(user_copy)
        store["users"] = users
        self._write_fallback(store)
        return True

    def update_user_profile(self, email: str, name: str, location: str = "", photo: str = "") -> bool:
        """Updates basic user profile (name, location, and photo)."""
        clean_email = email.strip().lower()
        update_fields = {"name": name}
        if location:
            update_fields["location"] = location
        if photo:
            update_fields["photo"] = photo

        if self.use_mongo and self.db is not None:
            try:
                self.db.users.update_one(
                    {"email": clean_email},
                    {"$set": update_fields}
                )
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo profile update failed: {e}")

        store = self._read_fallback()
        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                u["name"] = name
                if location:
                    u["location"] = location
                if photo:
                    u["photo"] = photo
                break
        self._write_fallback(store)
        return True

    def update_user_weather_location(self, email: str, location_pref: Dict[str, Any]) -> bool:
        """Saves user's selected weather location preference in location_preferences collection with user isolation."""
        clean_email = email.strip().lower()
        pref_doc = dict(location_pref)
        pref_doc["user_email"] = clean_email
        pref_doc["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if self.use_mongo and self.db is not None:
            try:
                self.db.location_preferences.update_one(
                    {"user_email": clean_email},
                    {"$set": pref_doc},
                    upsert=True
                )
                self.db.users.update_one(
                    {"email": clean_email},
                    {"$set": {"weather_location_pref": location_pref}}
                )
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo location preference save failed: {e}")

        store = self._read_fallback()
        locs = store.get("location_preferences", [])
        idx = next((i for i, l in enumerate(locs) if l.get("user_email", "").strip().lower() == clean_email), -1)
        if idx >= 0:
            locs[idx] = pref_doc
        else:
            locs.append(pref_doc)
        store["location_preferences"] = locs

        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                u["weather_location_pref"] = location_pref
                break

        self._write_fallback(store)
        return True

    def get_user_weather_location(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves user's saved weather location preference from location_preferences collection."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                pref = self.db.location_preferences.find_one({"user_email": clean_email}, {"_id": 0, "user_email": 0})
                if pref:
                    return pref
            except Exception as e:
                print(f"[SolarIQ DB] Mongo location preference fetch failed: {e}")

        store = self._read_fallback()
        for loc in store.get("location_preferences", []):
            if loc.get("user_email", "").strip().lower() == clean_email:
                clean_loc = dict(loc)
                clean_loc.pop("user_email", None)
                return clean_loc

        user = self.find_user_by_email(clean_email)
        if user and "weather_location_pref" in user:
            return user["weather_location_pref"]
        return None


    def change_user_password(self, email: str, new_password_hash: str) -> bool:
        """Updates password hash for a user."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                self.db.users.update_one(
                    {"email": clean_email},
                    {"$set": {"password_hash": new_password_hash}}
                )
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo password change failed: {e}")

        store = self._read_fallback()
        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                u["password_hash"] = new_password_hash
                break
        self._write_fallback(store)
        return True

    def toggle_user_status(self, email: str, status: str) -> bool:
        """Toggles user account status ('active' or 'disabled')."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                self.db.users.update_one({"email": clean_email}, {"$set": {"status": status}})
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo user status toggle failed: {e}")

        store = self._read_fallback()
        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                u["status"] = status
                break
        self._write_fallback(store)
        return True

    def delete_user_account(self, email: str) -> bool:
        """Deletes user account and associated user data."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                self.db.users.delete_one({"email": clean_email})
                self.db.history.delete_many({"user_email": clean_email})
                self.db.scenarios.delete_many({"user_email": clean_email})
                self.db.email_otps.delete_many({"email": clean_email})
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo delete user failed: {e}")

        store = self._read_fallback()
        store["users"] = [u for u in store.get("users", []) if u.get("email", "").lower() != clean_email]
        store["history"] = [h for h in store.get("history", []) if h.get("user_email", "").lower() != clean_email]
        store["scenarios"] = [s for s in store.get("scenarios", []) if s.get("user_email", "").lower() != clean_email]
        store["email_otps"] = [o for o in store.get("email_otps", []) if o.get("email", "").lower() != clean_email]
        self._write_fallback(store)
        return True

    def get_all_users(self) -> List[Dict[str, Any]]:
        """Retrieves all registered users without password hashes, enriched with activity counts."""
        if self.use_mongo and self.db is not None:
            try:
                cursor = self.db.users.find({}, {"_id": 0, "password_hash": 0})
                users = list(cursor)
                for u in users:
                    em = u.get("email", "")
                    u["num_analyses"] = self.db.history.count_documents({"user_email": em})
                    u["num_scenarios"] = self.db.scenarios.count_documents({"user_email": em})
                return users
            except Exception as e:
                print(f"[SolarIQ DB] Mongo fetch users failed ({e}), using fallback.")

        store = self._read_fallback()
        users = []
        for u in store.get("users", []):
            u_clean = dict(u)
            u_clean.pop("password_hash", None)
            em = u_clean.get("email", "")
            u_clean["num_analyses"] = len([h for h in store.get("history", []) if h.get("user_email") == em])
            u_clean["num_scenarios"] = len([s for s in store.get("scenarios", []) if s.get("user_email") == em])
            users.append(u_clean)
        return users

    def seed_default_accounts(self, hash_func):
        """Seeds initial Administrator account (99240040247@klu.ac.in) and cleans up legacy demo accounts."""
        admin_email = os.getenv("ADMIN_EMAIL", "99240040247@klu.ac.in").strip().lower()
        admin_password = os.getenv("ADMIN_PASSWORD", "Kedar@12345")

        # Automatically purge legacy demo accounts
        self.delete_user_account("admin@solariq.io")
        self.delete_user_account("user@solariq.io")

        admin_user = self.find_user_by_email(admin_email)
        if not admin_user:
            self.save_user({
                "name": "Administrator",
                "email": admin_email,
                "password_hash": hash_func(admin_password),
                "role": "admin",
                "status": "active",
                "location": "Global Solar Monitoring Hub"
            })
            print(f"[SolarIQ DB] Initialized Administrator account ({admin_email}).")
        else:
            # Enforce admin role and ensure password matches configured ADMIN_PASSWORD
            updated = False
            if admin_user.get("role") != "admin":
                admin_user["role"] = "admin"
                updated = True
            if admin_user.get("status") != "active":
                admin_user["status"] = "active"
                updated = True
            current_hash = hash_func(admin_password)
            if admin_user.get("password_hash") != current_hash:
                admin_user["password_hash"] = current_hash
                updated = True
            if updated:
                self.save_user(admin_user)

    def save_history(self, record: Dict[str, Any], user_email: Optional[str] = None) -> str:
        """Saves an analysis run to MongoDB history collection with user_email isolation."""
        record_copy = dict(record)
        record_copy["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        record_copy["user_email"] = user_email.strip().lower() if user_email else "99240040247@klu.ac.in"

        if self.use_mongo and self.db is not None:
            try:
                res = self.db.history.insert_one(record_copy)
                return str(res.inserted_id)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo insert failed ({e}), using fallback.")

        store = self._read_fallback()
        record_copy["id"] = len(store.get("history", [])) + 1
        store.setdefault("history", []).insert(0, record_copy)
        self._write_fallback(store)
        return str(record_copy["id"])

    def get_history(self, user_email: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves history records isolated by user_email if provided."""
        if self.use_mongo and self.db is not None:
            try:
                query = {"user_email": user_email.strip().lower()} if user_email else {}
                cursor = self.db.history.find(query, {"_id": 0}).sort("_id", -1).limit(limit)
                return list(cursor)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo fetch history failed ({e}), using fallback.")

        store = self._read_fallback()
        hist = store.get("history", [])
        if user_email:
            clean_email = user_email.strip().lower()
            hist = [h for h in hist if h.get("user_email", "").strip().lower() == clean_email]
        return hist[:limit]

    def delete_history_item(self, item_id: Any, user_email: Optional[str] = None) -> bool:
        """Deletes a history item by ID, ensuring user ownership."""
        clean_email = user_email.strip().lower() if user_email else None
        if self.use_mongo and self.db is not None:
            try:
                query = {"id": int(item_id)}
                if clean_email:
                    query["user_email"] = clean_email
                res = self.db.history.delete_one(query)
                if res.deleted_count > 0:
                    return True
            except Exception:
                pass

        store = self._read_fallback()
        hist = store.get("history", [])
        new_hist = []
        deleted = False
        for h in hist:
            if str(h.get("id")) == str(item_id):
                if not clean_email or h.get("user_email", "").strip().lower() == clean_email:
                    deleted = True
                    continue
            new_hist.append(h)
        if deleted:
            store["history"] = new_hist
            self._write_fallback(store)
            return True
        return False

    def clear_all_history(self, user_email: Optional[str] = None) -> bool:
        """Clears history for specific user or all if user_email is None."""
        clean_email = user_email.strip().lower() if user_email else None
        if self.use_mongo and self.db is not None:
            try:
                query = {"user_email": clean_email} if clean_email else {}
                self.db.history.delete_many(query)
            except Exception:
                pass
        store = self._read_fallback()
        if clean_email:
            store["history"] = [h for h in store.get("history", []) if h.get("user_email", "").strip().lower() != clean_email]
        else:
            store["history"] = []
        self._write_fallback(store)
        return True

    def save_scenario(self, name: str, params: Dict[str, Any], results: Dict[str, Any], user_email: Optional[str] = None) -> str:
        """Saves a scenario snapshot to MongoDB scenarios collection with user_email isolation."""
        scenario_doc = {
            "name": name,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "params": params,
            "results": results,
            "user_email": user_email.strip().lower() if user_email else "99240040247@klu.ac.in"
        }

        if self.use_mongo and self.db is not None:
            try:
                res = self.db.scenarios.insert_one(scenario_doc)
                return str(res.inserted_id)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo scenario insert failed ({e}), using fallback.")

        store = self._read_fallback()
        scenario_doc["id"] = len(store.get("scenarios", [])) + 1
        store.setdefault("scenarios", []).insert(0, scenario_doc)
        self._write_fallback(store)
        return str(scenario_doc["id"])

    def get_scenarios(self, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves saved scenarios, isolated by user_email if provided."""
        if self.use_mongo and self.db is not None:
            try:
                query = {"user_email": user_email.strip().lower()} if user_email else {}
                cursor = self.db.scenarios.find(query, {"_id": 0}).sort("_id", -1)
                return list(cursor)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo scenarios fetch failed ({e}), using fallback.")

        store = self._read_fallback()
        scens = store.get("scenarios", [])
        if user_email:
            clean_email = user_email.strip().lower()
            scens = [s for s in scens if s.get("user_email", "").strip().lower() == clean_email]
        return scens

    def delete_scenario(self, scenario_id: Any, user_email: Optional[str] = None) -> bool:
        """Deletes a scenario by ID, enforcing user ownership."""
        clean_email = user_email.strip().lower() if user_email else None
        if self.use_mongo and self.db is not None:
            try:
                query = {"id": int(scenario_id)}
                if clean_email:
                    query["user_email"] = clean_email
                res = self.db.scenarios.delete_one(query)
                if res.deleted_count > 0:
                    return True
            except Exception:
                pass

        store = self._read_fallback()
        scens = store.get("scenarios", [])
        new_scens = []
        deleted = False
        for s in scens:
            if str(s.get("id")) == str(scenario_id):
                if not clean_email or s.get("user_email", "").strip().lower() == clean_email:
                    deleted = True
                    continue
            new_scens.append(s)
        if deleted:
            store["scenarios"] = new_scens
            self._write_fallback(store)
            return True
        return False

    def log_activity(self, event_type: str, user_email: str, metadata: Optional[Dict[str, Any]] = None):
        """Logs platform events to activity_logs collection/fallback."""
        entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": event_type,
            "user_email": user_email.strip().lower(),
            "metadata": metadata or {}
        }
        if self.use_mongo and self.db is not None:
            try:
                self.db.activity_logs.insert_one(entry)
                return
            except Exception:
                pass

        store = self._read_fallback()
        entry["id"] = len(store.get("activity_logs", [])) + 1
        store.setdefault("activity_logs", []).insert(0, entry)
        self._write_fallback(store)

    def get_activity_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves recent system activity logs."""
        if self.use_mongo and self.db is not None:
            try:
                cursor = self.db.activity_logs.find({}, {"_id": 0}).sort("_id", -1).limit(limit)
                return list(cursor)
            except Exception:
                pass

        store = self._read_fallback()
        return store.get("activity_logs", [])[:limit]

    def get_platform_analytics(self) -> Dict[str, Any]:
        """Calculates aggregate metrics for Admin Analysis Monitoring."""
        hist = self.get_history(user_email=None, limit=500)
        total = len(hist)
        if total == 0:
            return {
                "total_analyses": 0,
                "avg_predicted_power_w": 0.0,
                "avg_efficiency_pct": 0.0,
                "avg_health_score": 0.0,
                "total_co2_saved_kg": 0.0
            }
        avg_power = sum(h.get("ai_power_w", 0.0) for h in hist) / total
        avg_eff = sum(h.get("efficiency_percent", 0.0) for h in hist) / total
        avg_health = sum(h.get("health_score", 0.0) for h in hist) / total
        total_co2 = sum(h.get("co2_avoided_kg", 0.0) for h in hist)

        return {
            "total_analyses": total,
            "avg_predicted_power_w": round(avg_power, 2),
            "avg_efficiency_pct": round(avg_eff, 2),
            "avg_health_score": round(avg_health, 1),
            "total_co2_saved_kg": round(total_co2, 2)
        }

    def save_report(self, report_doc: Dict[str, Any], user_email: str) -> str:
        """Saves an audit/analysis report to MongoDB reports collection with user isolation."""
        doc = dict(report_doc)
        doc["user_email"] = user_email.strip().lower()
        doc["timestamp"] = doc.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        if self.use_mongo and self.db is not None:
            try:
                res = self.db.reports.insert_one(doc)
                return str(res.inserted_id)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo report insert failed: {e}")

        store = self._read_fallback()
        doc["id"] = len(store.get("reports", [])) + 1
        store.setdefault("reports", []).insert(0, doc)
        self._write_fallback(store)
        return str(doc["id"])

    def get_reports(self, user_email: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves reports isolated by user_email if provided."""
        clean_email = user_email.strip().lower() if user_email else None
        if self.use_mongo and self.db is not None:
            try:
                query = {"user_email": clean_email} if clean_email else {}
                cursor = self.db.reports.find(query, {"_id": 0}).sort("_id", -1).limit(limit)
                return list(cursor)
            except Exception as e:
                print(f"[SolarIQ DB] Mongo fetch reports failed: {e}")

        store = self._read_fallback()
        reps = store.get("reports", [])
        if clean_email:
            reps = [r for r in reps if r.get("user_email", "").strip().lower() == clean_email]
        return reps[:limit]

    def delete_report(self, report_id: Any, user_email: Optional[str] = None) -> bool:
        """Deletes a report by ID, verifying user ownership."""
        clean_email = user_email.strip().lower() if user_email else None
        if self.use_mongo and self.db is not None:
            try:
                query = {"id": str(report_id)}
                if clean_email:
                    query["user_email"] = clean_email
                res = self.db.reports.delete_one(query)
                if res.deleted_count > 0:
                    return True
            except Exception:
                pass

        store = self._read_fallback()
        reps = store.get("reports", [])
        new_reps = []
        deleted = False
        for r in reps:
            if str(r.get("id")) == str(report_id):
                if not clean_email or r.get("user_email", "").strip().lower() == clean_email:
                    deleted = True
                    continue
            new_reps.append(r)
        if deleted:
            store["reports"] = new_reps
            self._write_fallback(store)
            return True
        return False

    def get_db_status(self) -> Dict[str, Any]:
        """Provides actual MongoDB connection status and collection metrics."""
        if self.use_mongo and self.db is not None:
            try:
                return {
                    "connected": True,
                    "database": DB_NAME,
                    "backend_driver": "PyMongo",
                    "collections": {
                        "users": self.db.users.count_documents({}),
                        "history": self.db.history.count_documents({}),
                        "scenarios": self.db.scenarios.count_documents({}),
                        "location_preferences": self.db.location_preferences.count_documents({}),
                        "activity_logs": self.db.activity_logs.count_documents({}),
                        "reports": self.db.reports.count_documents({})
                    }
                }
            except Exception:
                pass

        store = self._read_fallback()
        return {
            "connected": False,
            "database": DB_NAME,
            "backend_driver": "Zero-Downtime JSON Storage (Fallback)",
            "collections": {
                "users": len(store.get("users", [])),
                "history": len(store.get("history", [])),
                "scenarios": len(store.get("scenarios", [])),
                "location_preferences": len(store.get("location_preferences", [])),
                "activity_logs": len(store.get("activity_logs", [])),
                "reports": len(store.get("reports", [])),
                "email_otps": len(store.get("email_otps", []))
            }
        }

    # --- Email OTP Verification Persistence Methods ---

    def save_otp(self, email: str, otp_hash: str, expires_at_iso: str) -> bool:
        """Saves temporary hashed OTP record for email address."""
        clean_email = email.strip().lower()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        doc = {
            "email": clean_email,
            "otp_hash": otp_hash,
            "expires_at": expires_at_iso,
            "attempts": 0,
            "verified": False,
            "created_at": now_str
        }

        if self.use_mongo and self.db is not None:
            try:
                self.db.email_otps.delete_many({"email": clean_email})
                self.db.email_otps.insert_one(doc)
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo save OTP failed ({e}), using fallback.")

        store = self._read_fallback()
        otps = [o for o in store.get("email_otps", []) if o.get("email") != clean_email]
        otps.append(doc)
        store["email_otps"] = otps
        self._write_fallback(store)
        return True

    def get_latest_otp(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves active OTP record for an email address."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                otp_doc = self.db.email_otps.find_one({"email": clean_email}, {"_id": 0})
                if otp_doc:
                    return otp_doc
            except Exception as e:
                print(f"[SolarIQ DB] Mongo OTP lookup failed ({e}), using fallback.")

        store = self._read_fallback()
        for o in store.get("email_otps", []):
            if o.get("email") == clean_email:
                return o
        return None

    def increment_otp_attempts(self, email: str) -> int:
        """Increments attempt counter for active OTP record. Invalidates if attempts >= 5."""
        clean_email = email.strip().lower()
        if self.use_mongo and self.db is not None:
            try:
                res = self.db.email_otps.find_one_and_update(
                    {"email": clean_email},
                    {"$inc": {"attempts": 1}},
                    return_document=pymongo.ReturnDocument.AFTER
                )
                if res:
                    attempts = res.get("attempts", 0)
                    if attempts >= 5:
                        self.db.email_otps.update_one({"email": clean_email}, {"$set": {"verified": False, "expired": True}})
                    return attempts
            except Exception as e:
                print(f"[SolarIQ DB] Mongo increment OTP attempts failed: {e}")

        store = self._read_fallback()
        attempts = 0
        for o in store.get("email_otps", []):
            if o.get("email") == clean_email:
                o["attempts"] = o.get("attempts", 0) + 1
                attempts = o["attempts"] = o["attempts"]
                if attempts >= 5:
                    o["verified"] = False
                    o["expired"] = True
                break
        self._write_fallback(store)
        return attempts

    def mark_otp_verified(self, email: str) -> bool:
        """Marks active OTP record as verified."""
        clean_email = email.strip().lower()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if self.use_mongo and self.db is not None:
            try:
                self.db.email_otps.update_one(
                    {"email": clean_email},
                    {"$set": {"verified": True, "verified_at": now_str}}
                )
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo mark OTP verified failed: {e}")

        store = self._read_fallback()
        for o in store.get("email_otps", []):
            if o.get("email") == clean_email:
                o["verified"] = True
                o["verified_at"] = now_str
                break
        self._write_fallback(store)
        return True

    def is_email_verified(self, email: str) -> bool:
        """Checks if email has been verified via OTP."""
        clean_email = email.strip().lower()
        otp = self.get_latest_otp(clean_email)
        if not otp:
            return False
        if not otp.get("verified"):
            return False
        return True

    def save_profile_photo(self, email: str, relative_url: str, filename: str = "", mime_type: str = "") -> bool:
        """Saves user profile photo reference and metadata in database."""
        clean_email = email.strip().lower()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_fields = {
            "photo": relative_url,
            "profile_photo_url": relative_url,
            "profile_photo_filename": filename,
            "profile_photo_mime_type": mime_type,
            "profile_photo_updated_at": now_str
        }

        if self.use_mongo and self.db is not None:
            try:
                self.db.users.update_one(
                    {"email": clean_email},
                    {"$set": update_fields}
                )
                return True
            except Exception as e:
                print(f"[SolarIQ DB] Mongo save profile photo failed: {e}")

        store = self._read_fallback()
        for u in store.get("users", []):
            if u.get("email", "").strip().lower() == clean_email:
                u["photo"] = relative_url
                u["profile_photo_url"] = relative_url
                u["profile_photo_filename"] = filename
                u["profile_photo_mime_type"] = mime_type
                u["profile_photo_updated_at"] = now_str
                break
        self._write_fallback(store)
        return True

db_manager = SolarIQDatabaseManager()


