"""
Incident Weight Calculation Utility

This module calculates the weight/impact of incidents on region safety scores.
Weight is determined by:
1. Base weight (very low by default)
2. Engagement multipliers (comments, description quality, images)
3. Validation score (admin/NGO audits - majority of impact)
"""

from typing import Dict


# Configuration constants
BASE_WEIGHT = 1.0  # Default base weight for any incident
MIN_DESCRIPTION_LENGTH = 50  # Minimum chars for "sufficient" description
MAX_ENGAGEMENT_SCORE = 100.0
MAX_VALIDATION_SCORE = 100.0

# Weight multipliers for engagement factors
COMMENT_WEIGHT = 5.0  # Points per comment
SUFFICIENT_DESC_WEIGHT = 15.0  # Bonus for good description
IMAGE_WEIGHT = 10.0  # Points per image

# Severity multipliers
SEVERITY_MULTIPLIERS = {
    "low": 1.0,
    "medium": 1.5,
    "high": 2.5,
    "critical": 4.0
}


def calculate_engagement_score(
    comment_count: int,
    has_sufficient_description: bool,
    image_count: int
) -> float:
    """
    Calculate engagement score (0-100) based on user interactions.
    
    Args:
        comment_count: Number of comments/discussions on incident
        has_sufficient_description: Whether description is detailed enough
        image_count: Number of images attached
    
    Returns:
        Engagement score from 0 to 100
    """
    score = 0.0
    
    # Add points for comments (max 5 comments counted)
    score += min(comment_count * COMMENT_WEIGHT, 25.0)
    
    # Add points for sufficient description
    if has_sufficient_description:
        score += SUFFICIENT_DESC_WEIGHT
    
    # Add points for images (max 5 images counted)
    score += min(image_count * IMAGE_WEIGHT, 50.0)
    
    # Cap at MAX_ENGAGEMENT_SCORE
    return min(score, MAX_ENGAGEMENT_SCORE)


def calculate_validation_score(
    admin_validated: bool,
    ngo_validated: bool
) -> float:
    """
    Calculate validation score (0-100) based on admin/NGO audits.
    This is the primary factor in safety score calculation.
    
    Args:
        admin_validated: Whether admin has validated/audited
        ngo_validated: Whether NGO has validated/audited
    
    Returns:
        Validation score from 0 to 100
    """
    score = 0.0
    
    # Admin validation contributes 50%
    if admin_validated:
        score += 50.0
    
    # NGO validation contributes 50%
    if ngo_validated:
        score += 50.0
    
    return score


def calculate_incident_weight(
    severity: str,
    comment_count: int,
    has_sufficient_description: bool,
    image_count: int,
    admin_validated: bool,
    ngo_validated: bool
) -> Dict[str, float]:
    """
    Calculate comprehensive weight for an incident.
    
    Returns a dict with:
    - engagement_score: Score from user interactions (0-100)
    - validation_score: Score from admin/NGO validation (0-100)
    - final_weight: Combined weight considering all factors
    
    Weight formula:
    base_weight * severity_multiplier * (1 + engagement_factor) * validation_factor
    
    Where:
    - engagement_factor = engagement_score / 100 (max 100% boost)
    - validation_factor = 1 + (validation_score / 100) * 4 (up to 5x multiplier)
    """
    # Calculate engagement score
    engagement_score = calculate_engagement_score(
        comment_count, has_sufficient_description, image_count
    )
    
    # Calculate validation score
    validation_score = calculate_validation_score(
        admin_validated, ngo_validated
    )
    
    # Get severity multiplier
    severity_mult = SEVERITY_MULTIPLIERS.get(severity, 1.5)
    
    # Calculate engagement factor (0.0 to 1.0 boost)
    engagement_factor = engagement_score / 100.0
    
    # Calculate validation factor (1.0 to 5.0 multiplier)
    # This is the major impact - validated incidents have much higher weight
    validation_factor = 1.0 + (validation_score / 100.0) * 4.0
    
    # Final weight calculation
    final_weight = (
        BASE_WEIGHT * 
        severity_mult * 
        (1.0 + engagement_factor) * 
        validation_factor
    )
    
    return {
        "engagement_score": round(engagement_score, 2),
        "validation_score": round(validation_score, 2),
        "base_weight": BASE_WEIGHT,
        "final_weight": round(final_weight, 2)
    }


def check_description_sufficiency(description: str) -> bool:
    """
    Check if description is sufficiently detailed.
    
    Args:
        description: The incident description text
    
    Returns:
        True if description meets minimum quality standards
    """
    if not description:
        return False
    
    # Remove extra whitespace and check length
    cleaned = description.strip()
    return len(cleaned) >= MIN_DESCRIPTION_LENGTH
