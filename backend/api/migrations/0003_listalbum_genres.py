# Generated by Django 5.1.3 on 2024-12-10 00:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_listalbum_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='listalbum',
            name='genres',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
