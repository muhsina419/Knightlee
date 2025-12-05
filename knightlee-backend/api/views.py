from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Incident
from .serializers import IncidentSerializer
import requests, math
from django.conf import settings

@api_view(['GET'])
def get_incidents(request):
    incidents = Incident.objects.all()
    return Response(IncidentSerializer(incidents, many=True).data)

@api_view(['POST'])
def add_incident(request):
    serializer = IncidentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)
from .utils import calculate_safety

def get_route(request):
    # fetch route from Mapbox or OSRM
    route = fetch_route_data()

    safety_score = calculate_safety(route)

    return JsonResponse({
        "route": route,
        "safety_score": safety_score,
    })
import requests
from django.conf import settings
from django.http import JsonResponse
from .utils import calculate_safety

def get_route(request):
    start = request.GET.get("start")  # "lat,lng"
    end = request.GET.get("end")      # "lat,lng"

    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start};{end}"
    params = {
        "alternatives": "false",
        "steps": "true",
        "geometries": "geojson",
        "access_token": settings.MAPBOX_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    route = data["routes"][0]  # first route

    # ⭐ Calculate safety
    safety_score = calculate_safety(route)

    return JsonResponse({
        "route": route,
        "safety_score": safety_score
    })
