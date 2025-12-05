# api/utils.py
import requests
import math
from django.conf import settings
from .models import Incident

def fetch_route(start, end, mode="driving"):
    """
    start, end: strings "lng,lat" (Mapbox expects lng,lat)
    """
    url = "https://api.mapbox.com/directions/v5/mapbox/{mode}/{start};{end}".format(
        mode=mode, start=start, end=end
    )
    params = {
        "geometries": "geojson",
        "steps": "true",
        "alternatives": "true",
        "access_token": settings.MAPBOX_API_KEY,
    }
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    return resp.json()

def get_nearby_incidents(lat, lng, radius_deg=0.002):
    """
    simple euclidean filter in degrees (approx ~200m for ~0.002)
    """
    incidents = Incident.objects.all()
    count = 0
    for inc in incidents:
        dist = math.sqrt((inc.latitude - lat)**2 + (inc.longitude - lng)**2)
        if dist < radius_deg:
            count += 1
    return count

def calculate_safety(route):
    """
    route: one Mapbox route dict (with legs -> steps -> maneuver.location)
    returns safety score 0..100
    """
    score = 100
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            loc = step.get("maneuver", {}).get("location")
            if not loc or len(loc) < 2:
                continue
            lng, lat = loc[0], loc[1]
            incidents = get_nearby_incidents(lat, lng)
            score -= incidents * 5
    return max(int(score), 0)
