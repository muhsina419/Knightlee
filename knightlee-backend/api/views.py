# api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .models import BlackSpot


from .serializers import (
    RegisterSerializer, IncidentSerializer, UserProfileSerializer, SOSSerializer
)
from .models import Incident, UserProfile, SOSAlert
from .utils import fetch_route, calculate_safety

# Auth
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    refresh = RefreshToken.for_user(user)
    return Response({"refresh": str(refresh), "access": str(refresh.access_token)})

# Route
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_route(request):
    start = request.GET.get("start")   # expected "lng,lat"
    end = request.GET.get("end")       # expected "lng,lat"
    mode = request.GET.get("mode", "fastest")
    if not start or not end:
        return Response({"detail":"start and end required"}, status=status.HTTP_400_BAD_REQUEST)

    data = fetch_route(start, end, mode="driving")
    routes = data.get("routes", [])
    if not routes:
        return Response({"detail":"no routes"}, status=status.HTTP_404_NOT_FOUND)

    if mode == "fastest":
        chosen = routes[0]
        chosen["safety_score"] = calculate_safety(chosen)
    else:  # safest
        best = None
        best_score = -1
        for r in routes:
            s = calculate_safety(r)
            if s > best_score:
                best_score = s
                best = r
        chosen = best
        chosen["safety_score"] = best_score

    return Response(chosen)

# Incidents
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_incidents(request):
    incidents = Incident.objects.all().order_by("-timestamp")
    serializer = IncidentSerializer(incidents, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_incident(request):
    serializer = IncidentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upvote_incident(request, id):
    try:
        inc = Incident.objects.get(id=id)
    except Incident.DoesNotExist:
        return Response({"detail":"not found"}, status=status.HTTP_404_NOT_FOUND)
    inc.upvotes += 1
    inc.save()
    return Response({"id": inc.id, "upvotes": inc.upvotes})

# Road segment placeholder (using incidents as proxy)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def road_segment(request, id):
    # for MVP we return incidents for that id (you can replace with real segments later)
    try:
        inc = Incident.objects.get(id=id)
    except Incident.DoesNotExist:
        return Response({"detail":"not found"}, status=status.HTTP_404_NOT_FOUND)
    score = max(0, 100 - inc.upvotes * 5)
    return Response({
        "segment_id": id,
        "incident": IncidentSerializer(inc).data,
        "safety_score": score
    })

# SOS
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sos(request):
    serializer = SOSSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        # Optionally: trigger notifications here (SMS/email) — omitted for MVP
        return Response({"message":"SOS created"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Safe points (mocked)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def safe_points(request):
    near = request.GET.get("near")
    if not near:
        return Response({"detail":"near parameter required (lat,lng)"}, status=status.HTTP_400_BAD_REQUEST)
    lat, lng = map(float, near.split(","))
    data = [
        {"name":"Police Station","latitude":lat+0.001,"longitude":lng+0.001},
        {"name":"Hospital","latitude":lat-0.001,"longitude":lng-0.001},
        {"name":"24/7 Shop","latitude":lat+0.002,"longitude":lng},
    ]
    return Response(data)

# User profile
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    prof, _ = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(prof)
    return Response(serializer.data)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    prof, _ = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(prof, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(["GET"])
@permission_classes([AllowAny])
def incidents_geojson(request):
    incidents = Incident.objects.all()
    features = []
    for inc in incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc.longitude, inc.latitude],
            },
            "properties": {
                "incident_type": inc.incident_type,
                "upvotes": inc.upvotes,
            },
        })
    return Response({
        "type": "FeatureCollection",
        "features": features,
    })
@api_view(["GET"])
def crime_geojson(request):
    incidents = Incident.objects.all()
    return Response({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [i.longitude, i.latitude]},
                "properties": {"weight": 1}
            }
            for i in incidents
        ]
    })


@api_view(["GET"])
def blackspot_geojson(request):
    spots = BlackSpot.objects.all()
    return Response({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [s.longitude, s.latitude]},
                "properties": {"name": s.name, "severity": s.severity}
            }
            for s in spots
        ]
    })
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BlackSpot
from .serializers import BlackSpotSerializer

@api_view(["GET"])
def blackspot_list(request):
    blackspots = BlackSpot.objects.all()
    serializer = BlackSpotSerializer(blackspots, many=True)
    return Response(serializer.data)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CrimeHeatData

@api_view(["GET"])
def crime_heatmap_geojson(request):
    features = []

    for obj in CrimeHeatData.objects.all():
        features.append({
            "type": "Feature",
            "properties": {
                "city": obj.city,
                "crime_description": obj.crime_description,
                "crime_domain": obj.crime_domain,
            },
            "geometry": {
                "type": "Point",
                "coordinates": [obj.longitude, obj.latitude],  # [lng, lat]
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }
    return Response(geojson)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CrimeHeatData


@api_view(["GET"])
def crime_heatmap_geojson(request):
    features = []

    for obj in CrimeHeatData.objects.all():
        features.append({
            "type": "Feature",
            "properties": {
                "city": obj.city,
                "crime_description": obj.crime_description,
                "crime_domain": obj.crime_domain,
                "victim_age": obj.victim_age,
                "weapon_used": obj.weapon_used,
            },
            "geometry": {
                "type": "Point",
                "coordinates": [obj.longitude, obj.latitude],  # [lng, lat]
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    return Response(geojson)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CrimeHeatData


@api_view(["GET"])
def crime_heatmap_geojson(request):
    features = []

    for obj in CrimeHeatData.objects.all():
        features.append({
            "type": "Feature",
            "properties": {
                "city": obj.city,
                "crime_description": obj.crime_description,
                "crime_domain": obj.crime_domain,
                "victim_age": obj.victim_age,
                "weapon_used": obj.weapon_used,
            },
            "geometry": {
                "type": "Point",
                "coordinates": [obj.longitude, obj.latitude],  # [lng, lat]
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    return Response(geojson)
@api_view(["GET"])
def blackspots_along_route(request):
    """
    GET /api/blackspots-route/?start_lng=..&start_lat=..&end_lng=..&end_lat=..&buffer_km=1

    Returns:
    {
      "summary": {
        "route_distance_km": ...,
        "total_blackspots": ...,
        "avg_severity": ...,
        "max_severity": ...,
        "min_distance_km": ...,
        "buffer_km": ...,
        "safety_percentage": ...
      },
      "geojson": { FeatureCollection of blackspots along route }
    }
    """
    try:
        start_lng = float(request.query_params.get("start_lng"))
        start_lat = float(request.query_params.get("start_lat"))
        end_lng = float(request.query_params.get("end_lng"))
        end_lat = float(request.query_params.get("end_lat"))
        buffer_km = float(request.query_params.get("buffer_km", 1.0))
    except (TypeError, ValueError):
        return Response({"detail": "Invalid or missing route coordinates"}, status=400)

    route_distance_km = haversine_km(start_lat, start_lng, end_lat, end_lng)

    features = []
    severities = []
    min_distance = None

    for spot in BlackSpot.objects.all():
        d = point_segment_distance_km(
            spot.longitude, spot.latitude,
            start_lng, start_lat,
            end_lng, end_lat,
        )

        if d <= buffer_km:
            severities.append(spot.severity)
            if min_distance is None or d < min_distance:
                min_distance = d

            features.append({
                "type": "Feature",
                "properties": {
                    "id": spot.id,
                    "name": spot.name,
                    "severity": spot.severity,
                    "distance_km": round(d, 3),
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [spot.longitude, spot.latitude],
                },
            })

    total_blackspots = len(features)
    avg_severity = sum(severities) / total_blackspots if total_blackspots > 0 else 0
    max_severity = max(severities) if severities else 0

    # Simple risk -> safety calculation:
    # risk_per_km = (sum severity) / route_distance, clamp to [0, 1]
    if route_distance_km > 0 and total_blackspots > 0:
        total_severity = sum(severities)
        risk_per_km = total_severity / max(route_distance_km, 0.1)
        normalized_risk = min(risk_per_km / 3.0, 1.0)  # 3 severity/km = very risky
        safety_percentage = round((1.0 - normalized_risk) * 100)
    else:
        safety_percentage = 100  # no blackspots → fully safe

    summary = {
        "route_distance_km": round(route_distance_km, 2),
        "total_blackspots": total_blackspots,
        "avg_severity": round(avg_severity, 2),
        "max_severity": max_severity,
        "min_distance_km": round(min_distance, 2) if min_distance is not None else None,
        "buffer_km": buffer_km,
        "safety_percentage": safety_percentage,
    }

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    return Response({
        "summary": summary,
        "geojson": geojson,
    })
