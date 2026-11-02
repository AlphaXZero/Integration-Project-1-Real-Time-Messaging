from django.db import migrations
from django.db.models import Count


def mark_existing_groups(apps, schema_editor):
    """Conversations created before is_group existed were all set to False.
    Those with more than 2 participants are groups."""
    Conversation = apps.get_model("chat", "Conversation")
    group_ids = list(
        Conversation.objects.annotate(nb=Count("participants"))
        .filter(nb__gt=2)
        .values_list("id", flat=True)
    )
    Conversation.objects.filter(id__in=group_ids).update(is_group=True)


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0002_conversation_is_group_conversation_name"),
    ]

    operations = [
        migrations.RunPython(mark_existing_groups, migrations.RunPython.noop),
    ]
