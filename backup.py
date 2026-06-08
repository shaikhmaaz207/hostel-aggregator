# backup.py
# HA-37: Automated Database Backup Script
# Run daily via cron job or Windows Task Scheduler

import os
import subprocess
import datetime
import zipfile
import pathlib

# ── CONFIGURATION ──
DB_NAME     = 'hostel_aggregator_db'
DB_USER     = 'hostel_developer'
DB_HOST     = 'localhost'
DB_PORT     = '5432'
BACKUP_DIR  = pathlib.Path(__file__).parent / 'backups'

def create_backup():
    """
    Creates a compressed PostgreSQL backup file.
    Saves to /backups/ folder with timestamp.
    """
    # Create backups directory if it doesn't exist
    BACKUP_DIR.mkdir(exist_ok=True)

    # Generate timestamp
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"hostel_db_backup_{timestamp}.sql"
    zip_filename    = f"hostel_db_backup_{timestamp}.zip"

    backup_path = BACKUP_DIR / backup_filename
    zip_path    = BACKUP_DIR / zip_filename

    print(f"🔄 Starting backup at {datetime.datetime.now()}")
    print(f"📁 Backup directory: {BACKUP_DIR}")

    # Set password environment variable
    env = os.environ.copy()
    env['PGPASSWORD'] = 'your_secure_password'

    try:
        # Run pg_dump
        result = subprocess.run(
            [
                r'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe',
                '-h', DB_HOST,
                '-p', DB_PORT,
                '-U', DB_USER,
                '-d', DB_NAME,
                '-f', str(backup_path),
                '--verbose'
            ],
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"❌ Backup failed: {result.stderr}")
            return False

        print(f"✅ SQL backup created: {backup_filename}")

        # Compress the backup
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(backup_path, backup_filename)

        # Remove uncompressed file
        backup_path.unlink()

        size_kb = zip_path.stat().st_size / 1024
        print(f"✅ Compressed backup: {zip_filename} ({size_kb:.1f} KB)")
        print(f"🎉 Backup complete at {datetime.datetime.now()}")

        # Clean old backups (keep last 7)
        cleanup_old_backups()
        return True

    except FileNotFoundError:
        print("❌ pg_dump not found. Make sure PostgreSQL is in PATH.")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def cleanup_old_backups(keep=7):
    """Keep only the last N backups."""
    backups = sorted(BACKUP_DIR.glob('*.zip'), key=os.path.getmtime)
    if len(backups) > keep:
        for old in backups[:-keep]:
            old.unlink()
            print(f"🗑️ Deleted old backup: {old.name}")


def verify_indexes():
    """
    Verify database indexes exist using Django ORM.
    """
    print("\n🔍 Verifying database indexes...")

    import django
    import sys
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()

    from django.db import connection
    cursor = connection.cursor()

    cursor.execute("""
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE tablename = 'hostels_hostel'
        ORDER BY indexname;
    """)

    indexes = cursor.fetchall()
    print(f"✅ Found {len(indexes)} indexes on hostels_hostel:")
    for idx in indexes:
        print(f"   → {idx[0]}")

    return indexes


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'verify':
        verify_indexes()
    else:
        create_backup()