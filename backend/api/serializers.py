from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Album, Log, Profile, FavoriteAlbum, List, ListAlbum
from django.utils import timezone


# User Serializer
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        extra_kwargs = {'email': {'required': False}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user

# Album Serializer
class AlbumSerializer(serializers.ModelSerializer):
    average_rating = serializers.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        read_only=True
    )
    total_logs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Album
        fields = [
            'id', 
            'spotify_id', 
            'name', 
            'artist', 
            'image_url', 
            'release_date', 
            'external_url',
            'genres',
            'average_rating',
            'total_logs'
        ]
        read_only_fields = ['id', 'average_rating', 'total_logs']

    def validate_spotify_id(self, value):
        """
        Check that the spotify_id is valid.
        """
        if not value:
            raise serializers.ValidationError("spotify_id is required")
        return value

    def validate_release_date(self, value):
        """
        Check that the release_date is valid.
        """
        if not value:
            raise serializers.ValidationError("release_date is required")
        return value

# Favorite Album Serializer
class FavoriteAlbumSerializer(serializers.ModelSerializer):
    album = AlbumSerializer(read_only=True)
    
    class Meta:
        model = FavoriteAlbum
        fields = ['id', 'album', 'added_at']
        read_only_fields = ['added_at']

# Log Serializer
class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    album = AlbumSerializer(read_only=True)
    album_id = serializers.CharField(write_only=True)

    class Meta:
        model = Log
        fields = [
            'id',
            'user',
            'album',
            'album_id',
            'rating',
            'review',
            'created_at',
            'updated_at',
            'listen_date',
            'favorite_song',
            'relisten'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'album']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate(self, data):
        # Additional validation if needed
        return data

    def create(self, validated_data):
        # Remove album_id as it's handled in the view
        validated_data.pop('album_id', None)
        
        # The user and album will be provided by the view
        return Log.objects.create(**validated_data)

    def to_representation(self, instance):
        # Customize the output if needed
        representation = super().to_representation(instance)
        return representation

# Profile Serializer
class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    favorite_albums = serializers.SerializerMethodField()
    total_logs = serializers.SerializerMethodField()
    logs_this_year = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'bio', 'avatar', 'avatar_url', 'followers_count', 'favorite_albums', 'total_logs', 'logs_this_year']
        read_only_fields = ['id', 'username', 'followers_count', 'favorite_albums', 'total_logs', 'logs_this_year']

    def get_favorite_albums(self, obj):
        favorites = FavoriteAlbum.objects.filter(user=obj.user)
        return FavoriteAlbumSerializer(favorites, many=True).data

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request is not None:
                try:
                    return request.build_absolute_uri(obj.avatar.url)
                except Exception as e:
                    print(f"Error building avatar URL: {e}")
                    return None
        return None

    def update(self, instance, validated_data):
        print("Updating profile with:", validated_data)  # Debug print
        avatar = validated_data.pop('avatar', None)
        if avatar:
            instance.avatar = avatar
        return super().update(instance, validated_data)

    def get_total_logs(self, obj):
        return Log.objects.filter(user=obj.user).count()

    def get_logs_this_year(self, obj):
        current_year = timezone.now().year
        return Log.objects.filter(
            user=obj.user,
            created_at__year=current_year
        ).count()

# List Album Serializer
class ListAlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListAlbum
        fields = ['id', 'spotify_id', 'name', 'artist', 'image_url', 'release_date', 'external_url', 'list', 'rank', 'genres']
        read_only_fields = ['id']

# List Serializer
class ListSerializer(serializers.ModelSerializer):
    albums = ListAlbumSerializer(many=True, read_only=True)
    album_count = serializers.SerializerMethodField()

    class Meta:
        model = List
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'albums', 'album_count']
        read_only_fields = ['user']

    def get_album_count(self, obj):
        return obj.albums.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
