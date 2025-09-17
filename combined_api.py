from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs
import re
import yt_dlp
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Course Configuration
COURSES = {
    "python": {
        "playlist_id": "PLGjplNEQ1it8-0CmoljS5yeV-GlKSUEt0",
        "prompt_prefix": "Python programming concept: ",
        "thumbnail": "https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
        "description": "Complete Python programming course for beginners"
    },
    "java": {
        "playlist_id": "PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop",
        "prompt_prefix": "Java programming concept: ",
        "thumbnail": "https://i.ytimg.com/vi/BGTx91t8q50/maxresdefault.jpg",
        "description": "Java programming from basics to advanced"
    },
    "market-analysis": {
        "playlist_id": "PL8eNk_zTBST8i0iX_wTBFWgwKpN48t5KF",
        "prompt_prefix": "Market analysis concept: ",
        "thumbnail": "https://i.ytimg.com/vi/6JVqutwtz-s/maxresdefault.jpg",
        "description": "Learn market analysis techniques"
    },
    "dsa": {
        "playlist_id": "PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt",
        "prompt_prefix": "Data Structures and Algorithms: ",
        "thumbnail": "https://i.ytimg.com/vi/RBSGKlAvoiM/maxresdefault.jpg",
        "description": "Comprehensive DSA course with implementations"
    },
    "mongodb": {
        "playlist_id": "PL4cUxeGkcC9h77dJ-QJlwGlZlTd4ecZOA",
        "prompt_prefix": "MongoDB concept: ",
        "thumbnail": "https://i.ytimg.com/vi/-56x56UppqQ/maxresdefault.jpg",
        "description": "Complete MongoDB database tutorial"
    },
    "cpp": {
        "playlist_id": "PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL",
        "prompt_prefix": "C++ programming concept: ",
        "thumbnail": "https://i.ytimg.com/vi/yGB9jhsEsr8/maxresdefault.jpg",
        "description": "Learn C++ from basics to advanced"
    },
    "aws": {
        "playlist_id": "PL6XT0grm_TfgtwtwUit305qS-HhDvb4du",
        "prompt_prefix": "AWS cloud concept: ",
        "thumbnail": "https://i.ytimg.com/vi/0qowDdXJ_4I/maxresdefault.jpg",
        "description": "Learn AWS cloud computing fundamentals"
    },
    "javascript": {
        "playlist_id": "PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37",
        "prompt_prefix": "JavaScript concept: ",
        "thumbnail": "https://i.ytimg.com/vi/ER9SspLe4Hg/maxresdefault.jpg",
        "description": "Modern JavaScript from basics to advanced"
    },
    "ml": {
        "playlist_id": "PLKnIA16_Rmvbr7zKYQuBfsVkjoLcJgxHH",
        "prompt_prefix": "Machine Learning concept: ",
        "thumbnail": "https://i.ytimg.com/vi/ukzFI9rgwfU/maxresdefault.jpg",
        "description": "Practical Machine Learning with Python"
    },
    "blockchain": {
        "playlist_id": "PLYwpaL_SFmcDFRupamGc-9zc-vQqvkQnn",
        "prompt_prefix": "Blockchain concept: ",
        "thumbnail": "https://i.ytimg.com/vi/gyMwXuJrbJQ/maxresdefault.jpg",
        "description": "Blockchain development and cryptocurrency fundamentals"
    },
    "html": {
        "playlist_id": "PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg",
        "prompt_prefix": "HTML concept: ",
        "thumbnail": "https://i.ytimg.com/vi/BsDoLVMnmZs/maxresdefault.jpg",
        "description": "Complete HTML web development course for beginners"
    }
}


def extract_video_id(youtube_url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([^&]+)',
        r'(?:https?://)?(?:www\.)?youtu\.be/([^?]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([^/?]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
    return None


def get_video_transcript(video_id):
    """Get video transcript using yt-dlp"""
    try:
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'quiet': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            
            # Try manual captions first
            if 'subtitles' in info and 'en' in info['subtitles']:
                subtitles = info['subtitles']['en']
                text = " ".join([entry.get('text', '') for entry in subtitles])
                return text, 'en'
            
            # Try automatic captions
            elif 'automatic_captions' in info and 'en' in info['automatic_captions']:
                subtitles = info['automatic_captions']['en']
                text = " ".join([entry.get('text', '') for entry in subtitles])
                return text, 'en'
            
            # If no captions, get video info for alternative content
            else:
                alt_content = get_video_info_alternative(info)
                return alt_content, 'en' if alt_content else (None, None)
                
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}")
        return None, None


def get_video_info_alternative(info):
    """Alternative content when no transcript available"""
    try:
        title = info.get('title', '')
        description = info.get('description', '')
        uploader = info.get('uploader', '')
        tags = info.get('tags', [])
        
        content = f"""
        VIDEO TITLE: {title}
        CHANNEL: {uploader}
        
        DESCRIPTION:
        {description}
        
        TAGS: {', '.join(tags) if tags else 'No tags available'}
        """
        
        return content if len(content.strip()) > 50 else None
        
    except Exception as e:
        print(f"Error getting video info: {str(e)}")
        return None


def get_video_details_oembed(video_id):
    """Get video details using YouTube oEmbed"""
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'title': data.get('title', 'Unknown Title'),
                'author_name': data.get('author_name', 'Unknown Channel'),
                'thumbnail_url': data.get('thumbnail_url', '')
            }
        return None
        
    except Exception as e:
        print(f"Could not fetch video details: {str(e)}")
        return None


def summarize_with_groq(text, video_title="YouTube Video", model_name="gemma2-9b-it"):
    """Summarize text using Groq API via direct HTTP requests"""
    if not GROQ_API_KEY:
        return None, "Groq API key is not configured"

    try:
        # Truncate text if it's too long
        max_tokens = 6000
        words = text.split()
        if len(words) > max_tokens:
            words = words[:max_tokens]
            text = " ".join(words)

        # Improved prompt
        prompt = f"""
        You are an expert content summarizer. Below is the transcript/content from a YouTube video titled "{video_title}".

        Please analyze this content and provide a comprehensive summary that includes:

        MAIN TOPICS:
        - Identify the 3-5 main topics or themes discussed
        - For each topic, provide key points and insights

        KEY TAKEAWAYS:
        - What are the most important lessons or conclusions?
        - Any actionable advice or recommendations?

        OVERALL SUMMARY:
        - Provide a concise overall summary (2-3 paragraphs)
        - Highlight the core message and purpose

        If the content appears to be metadata (title, description, tags) rather than a full transcript, provide the best possible analysis based on available information.

        VIDEO CONTENT:
        {text}

        Please structure your response clearly with appropriate headings and bullet points.
        """

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes YouTube video content. Always provide the summary directly without asking for the video link."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "model": model_name,
            "temperature": 0.1,
            "max_tokens": 2000,
            "top_p": 0.9,
            "stream": False,
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"], None

    except Exception as e:
        print(f"Error generating summary with Groq: {str(e)}")
        return None, f"Failed to generate summary: {str(e)}"


@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify({
        "status": "success",
        "courses": COURSES
    })


@app.route('/api/course/<course_name>', methods=['GET'])
def get_course_details(course_name):
    course = COURSES.get(course_name.lower())
    if not course:
        return jsonify({"error": "Course not found"}), 404

    return jsonify({
        "status": "success",
        "course": course
    })


@app.route('/api/summarize', methods=['POST'])
def handle_summary():
    try:
        data = request.get_json()
        if not data or 'videoUrl' not in data:
            return jsonify({"error": "Video URL is required"}), 400

        # Extract and validate video ID
        video_id = extract_video_id(data['videoUrl'])
        if not video_id:
            return jsonify({"error": "Invalid YouTube URL format"}), 400
        
        print(f"Processing video ID: {video_id}")

        # Get video details for title
        video_details = get_video_details_oembed(video_id)
        video_title = video_details['title'] if video_details else "YouTube Video"

        # Get transcript/content using yt-dlp
        content, language = get_video_transcript(video_id)
        
        if not content:
            return jsonify({
                "error": "Could not retrieve content for summarization. Possible reasons:\n"
                        "- Video has no captions/transcript\n"
                        "- Video is private, age-restricted, or live stream\n"
                        "- The video may not have English captions"
            }), 400

        print(f"Content retrieved, length: {len(content)} characters")

        # Prepare context from course
        context = ""
        if 'course' in data and data['course'] in COURSES:
            context = COURSES[data['course']]['prompt_prefix']

        # Generate summary using Groq
        summary, error = summarize_with_groq(content, video_title)
        
        if error:
            return jsonify({"error": error}), 500

        return jsonify({
            "summary": summary,
            "videoId": video_id,
            "originalLanguage": language,
            "course": data.get('course', None),
            "status": "success",
            "transcriptLength": len(content),
            "videoTitle": video_title
        })

    except Exception as e:
        print(f"Unexpected error in handle_summary: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route('/api/chat', methods=['POST'])
def handle_chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Invalid request"}), 400

        # Use Groq API directly for chat
        if not GROQ_API_KEY:
            return jsonify({"error": "Groq API key is not configured"}), 500

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "messages": [{"role": "user", "content": data['message']}],
            "model": "gemma2-9b-it",
            "temperature": 0.7,
            "max_tokens": 1024
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        return jsonify({"response": response.json()["choices"][0]["message"]["content"]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "status": "ok",
        "message": "API is working!",
        "groq_key_set": bool(GROQ_API_KEY)
    })


@app.route('/api/test-transcript/<video_id>', methods=['GET'])
def test_transcript(video_id):
    """Test endpoint to debug transcript issues"""
    try:
        print(f"Testing transcript for video ID: {video_id}")
        
        # Get transcript/content
        content, language = get_video_transcript(video_id)
        
        return jsonify({
            "video_id": video_id,
            "fetched_transcript": {
                "language": language,
                "length": len(content) if content else 0,
                "preview": content[:200] + "..." if content and len(content) > 200 else content
            },
            "status": "success" if content else "no_transcript"
        })
        
    except Exception as e:
        return jsonify({
            "video_id": video_id,
            "error": str(e),
            "status": "error"
        })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)