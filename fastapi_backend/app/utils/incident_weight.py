"""
Incident Weight Calculation Utility

This module calculates the weight/impact of incidents on region safety scores.
"""

from typing import List, Tuple
from datetime import datetime
import math

# Configuration constants
ALPHA = 0.5 # Range for audit multiplier [1-alpha, 1+alpha]
DECAY_RATE = 0.01 # Exponential decay rate per day
MAX_SCORE_CEILING = 100.0 # For normalization

def calculate_auditor_credibility(verified_count: int, flagged_count: int) -> float:
    """
    Calculate auditor credibility score (C_a).
    C_a = verified_count / (verified_count + flagged_count + 1)
    Minimum floor: 0.1
    """
    credibility = verified_count / (verified_count + flagged_count + 1)
    return max(credibility, 0.1)

def calculate_audit_multiplier(s_env: float, c_a: float) -> float:
    """
    Calculate audit multiplier (M_a).
    M_a = 1 + (S_env - 0.5) * 2 * ALPHA * C_a
    """
    adjustment = (s_env - 0.5) * 2 * ALPHA * c_a
    return 1.0 + adjustment

def calculate_time_decay(created_at: datetime) -> float:
    """
    Calculate time-decay factor D(age).
    D(age) = e^(-lambda * age_in_days)
    """
    age = (datetime.utcnow() - created_at).days
    if age < 0: age = 0
    return math.exp(-DECAY_RATE * age)

def calculate_region_score(incidents: List, cluster_factor: float) -> Tuple[float, float]:
    """
    Calculate region raw score and normalized score.
    R_raw = CF(region) * sum(contrib_i)
    R_norm = normalized R_raw
    """
    total_contribution = 0.0
    for incident in incidents:
        # 1. Initial Weight
        w_initial = getattr(incident, 'initial_weight', 1.0)
        
        # 2. M_effective
        audits = getattr(incident, 'audits', [])
        if not audits:
            m_effective = 1.0
        else:
            # Simplified: Average of multipliers
            m_effective = sum(a.multiplier for a in audits) / len(audits)
            
        # 3. Time Decay
        d_age = calculate_time_decay(incident.created_at)
        
        contrib = w_initial * m_effective * d_age
        total_contribution += contrib
        
    r_raw = cluster_factor * total_contribution
    
    # Normalize (0-100)
    # Using a ceiling approach
    r_norm = min((r_raw / MAX_SCORE_CEILING) * 100.0, 100.0)
    
    return r_raw, r_norm
