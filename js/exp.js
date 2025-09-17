document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const API_BASE = "http://localhost:5000/api";
  let currentVideoId = "";
  let currentCourse = null;

  // Get course from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialCourse = urlParams.get("course");

  // Course data (moved from backend for frontend access)
  const COURSES = {
    python: {
      playlist_id: "PLGjplNEQ1it8-0CmoljS5yeV-GlKSUEt0",
      prompt_prefix: "Python programming concept: ",
      thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
      description: "Complete Python programming course for beginners",
    },
    java: {
      playlist_id: "PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop",
      prompt_prefix: "Java programming concept: ",
      thumbnail: "https://i.ytimg.com/vi/BGTx91t8q50/maxresdefault.jpg",
      description: "Java programming from basics to advanced",
    },
    "market-analysis": {
      playlist_id: "PL8eNk_zTBST8i0iX_wTBFWgwKpN48t5KF",
      prompt_prefix: "Market analysis concept: ",
      thumbnail: "https://i.ytimg.com/vi/6JVqutwtz-s/maxresdefault.jpg",
      description: "Learn market analysis techniques",
    },
    dsa: {
      playlist_id: "PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt",
      prompt_prefix: "Data Structures and Algorithms: ",
      thumbnail: "https://i.ytimg.com/vi/RBSGKlAvoiM/maxresdefault.jpg",
      description: "Comprehensive DSA course with implementations",
    },
    mongodb: {
      playlist_id: "PL4cUxeGkcC9h77dJ-QJlwGlZlTd4ecZOA",
      prompt_prefix: "MongoDB concept: ",
      thumbnail: "https://i.ytimg.com/vi/-56x56UppqQ/maxresdefault.jpg",
      description: "Complete MongoDB database tutorial",
    },
    cpp: {
      playlist_id: "PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL",
      prompt_prefix: "C++ programming concept: ",
      thumbnail: "https://i.ytimg.com/vi/yGB9jhsEsr8/maxresdefault.jpg",
      description: "Learn C++ from basics to advanced",
    },
    aws: {
      playlist_id: "PL6XT0grm_TfgtwtwUit305qS-HhDvb4du",
      prompt_prefix: "AWS cloud concept: ",
      thumbnail: "https://i.ytimg.com/vi/0qowDdXJ_4I/maxresdefault.jpg",
      description: "Learn AWS cloud computing fundamentals",
    },
    javascript: {
      playlist_id: "PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37",
      prompt_prefix: "JavaScript concept: ",
      thumbnail: "https://i.ytimg.com/vi/ER9SspLe4Hg/maxresdefault.jpg",
      description: "Modern JavaScript from basics to advanced",
    },
    ml: {
      playlist_id: "PLKnIA16_Rmvbr7zKYQuBfsVkjoLcJgxHH",
      prompt_prefix: "Machine Learning concept: ",
      thumbnail: "https://i.ytimg.com/vi/ukzFI9rgwfU/maxresdefault.jpg",
      description: "Practical Machine Learning with Python",
    },
    blockchain: {
      playlist_id: "PLYwpaL_SFmcDFRupamGc-9zc-vQqvkQnn",
      prompt_prefix: "Blockchain concept: ",
      thumbnail: "https://i.ytimg.com/vi/gyMwXuJrbJQ/maxresdefault.jpg",
      description: "Blockchain development and cryptocurrency fundamentals",
    },
    html: {
      playlist_id: "PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg",
      prompt_prefix: "HTML concept: ",
      thumbnail: "https://i.ytimg.com/vi/BsDoLVMnmZs/maxresdefault.jpg",
      description: "Complete HTML web development course for beginners",
    },
  };

  // Elements
  const messagesContainer = document.getElementById("messagesContainer");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const quickQuestions = document.querySelectorAll(".quick-question");
  const videoPlayer = document.getElementById("videoPlayer");
  const summarizeBtn = document.getElementById("summarizeBtn");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const summaryContent = document.getElementById("summaryContent");
  const summaryText = document.getElementById("summaryText");
  const summaryError = document.getElementById("summaryError");
  const errorText = document.getElementById("errorText");
  const statusLight = document.getElementById("statusLight");
  const statusText = document.getElementById("statusText");
  const courseSelector = document.getElementById("courseSelector");
  const videoList = document.getElementById("videoList");

  // Initialize courses
  async function initCourses() {
    try {
      const response = await fetch(`${API_BASE}/courses`);
      const data = await response.json();
      populateCourseSelector(data.courses);

      // If there's a course parameter in the URL, load it
      if (initialCourse && data.courses[initialCourse]) {
        currentCourse = initialCourse;
        await loadCourseVideos(initialCourse);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  }

  function populateCourseSelector(courses) {
    courseSelector.innerHTML = '<option value="">Select a Course</option>';
    Object.entries(courses).forEach(([id, course]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${id.toUpperCase()} - ${course.description}`;
      courseSelector.appendChild(option);
    });

    courseSelector.addEventListener("change", async (e) => {
      currentCourse = e.target.value;
      if (currentCourse) {
        await loadCourseVideos(currentCourse);
      }
    });
  }

  async function loadCourseVideos(courseId) {
    try {
      const courseResponse = await fetch(`${API_BASE}/course/${courseId}`);
      const { course } = await courseResponse.json();

      // Fetch playlist items
      const playlistId = course.playlist_id;
      const apiKey = "AIzaSyCRgHLZ3zJ1I3hfuWT28xn_mq0KNwZb4A0";
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
      );

      if (!playlistResponse.ok) throw new Error("Failed to fetch videos");

      const playlistData = await playlistResponse.json();

      // Get video IDs for batch duration request
      const videoIds = playlistData.items.map(
        (item) => item.snippet.resourceId.videoId
      );

      // Fetch video durations in batch
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
          ","
        )}&key=${apiKey}`
      );

      if (!videosResponse.ok)
        throw new Error("Failed to fetch video durations");

      const videosData = await videosResponse.json();

      // Create a map of videoId to duration
      const durationMap = {};
      videosData.items.forEach((video) => {
        durationMap[video.id] = formatDuration(video.contentDetails.duration);
      });

      // Combine playlist data with durations
      const videos = playlistData.items.map((item) => ({
        title: item.snippet.title,
        video_id: item.snippet.resourceId.videoId,
        duration: durationMap[item.snippet.resourceId.videoId] || "N/A",
      }));

      renderVideos(videos, courseId);
    } catch (error) {
      console.error("Failed to load course videos:", error);
      // Fallback to mock data if API fails
      const mockVideos = [
        { title: "Introduction", video_id: "IRGqGQh2bWg", duration: "10:00" },
        { title: "Basic Concepts", video_id: "yGB9jhsEsr8", duration: "15:30" },
        {
          title: "Advanced Topics",
          video_id: "7dPdMtBX1d8",
          duration: "18:15",
        },
      ];
      renderVideos(mockVideos, courseId);
    }
  }

  // Helper function to format ISO 8601 duration to HH:MM:SS
  function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    // Format as HH:MM:SS or MM:SS depending on hours
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function renderVideos(videos, courseId) {
    videoList.innerHTML = "";
    videos.forEach((video) => {
      const videoCard = document.createElement("div");
      videoCard.className = "lecture-card";
      videoCard.dataset.videoId = video.video_id;
      videoCard.innerHTML = `
                <div class="lecture-thumbnail">
                    <img src="https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg" alt="${video.title}">
                    <div class="duration">${video.duration}</div>
                </div>
                <div class="lecture-info">
                    <h4>${video.title}</h4>
                    <p>${COURSES[courseId].description}</p>
                </div>
            `;
      videoCard.addEventListener("click", () => {
        playVideo(video.video_id, courseId);
      });
      videoList.appendChild(videoCard);
    });
  }

  function playVideo(videoId, course) {
    currentVideoId = videoId;
    currentCourse = course;
    videoPlayer.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }

  // Helper functions
  function addMessage(text, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "user-message" : "bot-message";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = formatMessage(text, isUser);

    const timeSpan = document.createElement("span");
    timeSpan.className = "message-time";
    timeSpan.textContent = getCurrentTime();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  function formatMessage(text, isUser) {
    if (isUser) return text;

    text = text.replace(/\n/g, "<br>");
    text = text.replace(/(\d+)\.\s+(.*?)(<br>|$)/g, "<li>$2</li>");
    text = text.replace(/(\*|\-)\s+(.*?)(<br>|$)/g, "<li>$2</li>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");
    text = text.replace(
      /(Key points:|Main takeaways:|Overview:|Conclusion:)(.*?)(<br>|$)/g,
      "<strong>$1</strong>$2$3"
    );
    text = text.replace(/(.*?):\s*<br>/g, "<h4>$1:</h4>");

    if (text.includes("<li>")) {
      text = text.replace(/(<li>.*?<\/li>)+/g, "<ul>$&</ul>");
    }

    text = text.replace(/([^<>\n]+)(<br><br>|$)/g, function (match, p1) {
      if (!p1.startsWith("<") && !p1.endsWith(">")) {
        return "<p>" + p1 + "</p>";
      }
      return match;
    });

    return text;
  }

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Chat functions
  async function sendChatMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    messageInput.value = "";

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      addMessage(data.response, false);
    } catch (error) {
      addMessage(
        "Sorry, I couldn't process your request. " + error.message,
        false
      );
    }
  }

  // Video functions
  function getVideoIdFromUrl(url) {
    if (!url) return null;
    const embedMatch = url.match(/embed\/([^?]+)/);
    if (embedMatch) return embedMatch[1];
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    return watchMatch ? watchMatch[1] : null;
  }

  function handleVideoChange() {
    const newVideoId = getVideoIdFromUrl(videoPlayer.src);
    if (newVideoId && newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      const activeTab = document.querySelector(".sidebar-content.active").id;
      if (activeTab === "summarizer") {
        fetchVideoSummary();
      }
    }
  }

  // Summary functions
  async function fetchVideoSummary() {
    if (!currentVideoId) {
      errorText.textContent = "No video selected";
      summaryError.style.display = "block";
      return;
    }

    loadingSpinner.style.display = "flex";
    summaryContent.style.display = "none";
    summaryError.style.display = "none";
    statusLight.className = "status-light connecting";
    statusText.textContent = "Fetching transcript...";

    try {
      const response = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: `https://youtube.com/watch?v=${currentVideoId}`,
          course: currentCourse,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      summaryText.innerHTML = formatMessage(data.summary, false);
      summaryContent.style.display = "block";
      statusLight.className = "status-light";
      statusText.textContent =
        data.originalLanguage === "en"
          ? "Summary generated"
          : "Summary generated from translation";
    } catch (error) {
      errorText.textContent = `Error: ${error.message}`;
      summaryError.style.display = "block";
      statusLight.className = "status-light offline";
      statusText.textContent = error.message.includes("transcript")
        ? "No transcript available"
        : "Error generating summary";
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  // Tab switching
  document.querySelectorAll(".sidebar-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document
        .querySelectorAll(".sidebar-tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      const tabId = this.getAttribute("data-tab");
      document.querySelectorAll(".sidebar-content").forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(tabId).classList.add("active");

      if (tabId === "summarizer" && currentVideoId) {
        fetchVideoSummary();
      }
    });
  });

  // Event listeners
  sendButton.addEventListener("click", sendChatMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  summarizeBtn.addEventListener("click", fetchVideoSummary);

  quickQuestions.forEach((button) => {
    button.addEventListener("click", () => {
      messageInput.value = button.textContent;
      sendChatMessage();
    });
  });

  // Video observer
  const observer = new MutationObserver(() => handleVideoChange());
  observer.observe(videoPlayer, { attributes: true, attributeFilter: ["src"] });

  // Initialization
  initCourses();
  if (videoPlayer.src) {
    currentVideoId = getVideoIdFromUrl(videoPlayer.src);
  }
  loadingSpinner.style.display = "none";
});
