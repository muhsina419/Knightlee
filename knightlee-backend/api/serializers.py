# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Incident, UserProfile, SOSAlert

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        UserProfile.objects.create(user=user)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("emergency_contacts", "night_safety_mode")

class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = ("id","user","incident_type","description","latitude","longitude","upvotes","timestamp")
        read_only_fields = ("user","upvotes","timestamp")

class SOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOSAlert
        fields = ("id","user","latitude","longitude","timestamp")
        read_only_fields = ("user","timestamp")
from rest_framework import serializers
from .models import BlackSpot

class BlackSpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlackSpot
        fields = '__all__'
