"""
Script to check articles in the old Django database
"""
import sqlite3
import os
import json

# Path to old Django database
old_db_path = os.path.join(os.path.dirname(__file__), '../../backend/db.sqlite3')

try:
    conn = sqlite3.connect(old_db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print('📊 Checking old database tables...\n')
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    print('Tables found:')
    for t in tables:
        print(f"  - {t['name']}")
    
    # Check for articles table
    article_tables = [t['name'] for t in tables if 'article' in t['name'].lower() or 'content' in t['name'].lower()]
    
    print('\n📰 Article-related tables:')
    for t in article_tables:
        print(f"  - {t}")
    
    # Try to get articles count
    try:
        cursor.execute('SELECT COUNT(*) as count FROM contentapp_medicalarticle')
        count = cursor.fetchone()['count']
        print(f'\n✅ Found {count} articles in contentapp_medicalarticle')
        
        # Get sample articles
        cursor.execute('''
            SELECT id, title, title_ar, slug, status, featured_image, content_ar
            FROM contentapp_medicalarticle 
            LIMIT 10
        ''')
        samples = cursor.fetchall()
        
        print('\n📝 Sample articles:')
        for i, a in enumerate(samples, 1):
            print(f"  {i}. {a['title_ar'] or a['title']}")
            print(f"     Slug: {a['slug']}")
            print(f"     Status: {a['status']}")
            print(f"     Image: {'✅' if a['featured_image'] else '❌'}")
            print(f"     Content length: {len(a['content_ar'] or '')} chars")
        
        # Check categories
        cursor.execute('SELECT * FROM contentapp_articlecategory')
        categories = cursor.fetchall()
        print(f'\n📁 Found {len(categories)} categories:')
        for c in categories:
            print(f"  - {c['name_ar'] or c['name']}")
            
        # Count published articles
        cursor.execute("SELECT COUNT(*) as count FROM contentapp_medicalarticle WHERE status='published'")
        published = cursor.fetchone()['count']
        print(f'\n📊 Published articles: {published}')
        
        # Check images
        cursor.execute("SELECT COUNT(*) as count FROM contentapp_medicalarticle WHERE featured_image IS NOT NULL AND featured_image != ''")
        with_images = cursor.fetchone()['count']
        print(f'📷 Articles with images: {with_images}')
        
    except Exception as e:
        print(f'Error reading articles: {e}')
    
    conn.close()
    
except Exception as error:
    print(f'Error: {error}')
