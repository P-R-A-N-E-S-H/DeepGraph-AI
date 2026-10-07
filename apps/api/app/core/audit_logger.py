import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.core.logging import logger

class SecurityAuditEvent(BaseModel):
    event_id: str
    event_type: str  # PROMPT_DEFENSE_TRIGGER, RATE_LIMIT_WARNING, PII_REDACTED, EXPORT_OPERATION, INGESTION_ERROR
    severity: str    # INFO, WARNING, CRITICAL
    client_ip: Optional[str] = "127.0.0.1"
    details: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SecurityAuditLogger:
    """
    Records security detections, prompt defense activations, and data export events
    for enterprise compliance and model governance.
    """

    def __init__(self, max_history: int = 500):
        self._max_history = max_history
        self._events: List[SecurityAuditEvent] = []

    def record_event(
        self,
        event_type: str,
        severity: str = "INFO",
        client_ip: Optional[str] = "127.0.0.1",
        details: Optional[Dict[str, Any]] = None
    ) -> SecurityAuditEvent:
        ev_id = f"aud_{int(time.time() * 1000)}"
        event = SecurityAuditEvent(
            event_id=ev_id,
            event_type=event_type,
            severity=severity,
            client_ip=client_ip,
            details=details or {}
        )

        self._events.append(event)
        if len(self._events) > self._max_history:
            self._events.pop(0)

        if severity == "CRITICAL":
            logger.critical(f"[SECURITY AUDIT] {event_type}: {details}", extra={"audit_id": ev_id})
        elif severity == "WARNING":
            logger.warning(f"[SECURITY AUDIT] {event_type}: {details}", extra={"audit_id": ev_id})
        else:
            logger.info(f"[AUDIT] {event_type}: {details}", extra={"audit_id": ev_id})

        return event

    def get_recent_events(self, limit: int = 50, severity_filter: Optional[str] = None) -> List[SecurityAuditEvent]:
        filtered = self._events
        if severity_filter:
            filtered = [e for e in filtered if e.severity.upper() == severity_filter.upper()]
        return filtered[-limit:]

    def get_summary(self) -> Dict[str, Any]:
        sev_counts = {"INFO": 0, "WARNING": 0, "CRITICAL": 0}
        type_counts: Dict[str, int] = {}

        for e in self._events:
            sev_counts[e.severity] = sev_counts.get(e.severity, 0) + 1
            type_counts[e.event_type] = type_counts.get(e.event_type, 0) + 1

        return {
            "total_events_recorded": len(self._events),
            "severity_breakdown": sev_counts,
            "event_type_breakdown": type_counts
        }

audit_logger = SecurityAuditLogger()
