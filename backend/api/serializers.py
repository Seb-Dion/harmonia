from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Album, Log


# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

# Album Serializer
class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['id', 'title', 'artist', 'release_date', 'cover_url']


# Log Serializer
class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Read-only nested user details
    album = AlbumSerializer(read_only=True)  # Read-only nested album details

    class Meta:
        model = Log
        fields = ['id', 'user', 'album', 'rating', 'review', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
