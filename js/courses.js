const cards = [
  {
    id: 1,
    title: "HTML",
    image: "assets/courses/html.png",
    description:
      "Build the backbone of every website. Learn how to structure content, create forms, and design beautiful layouts using HTML.",
  },
  {
    id: 2,
    title: "PYTHON",
    image: "assets/courses/python.png",
    description:
      "Unlock the power of simplicity. Python is perfect for beginners and pros alike—great for web, data science, AI, and automation. ",
  },
  {
    id: 3,
    title: "JAVA",
    image: "assets/courses/java.png",
    description:
      "Master one of the most powerful and widely-used programming languages. From Android apps to enterprise software—Java does it all. ",
  },
  {
    id: 4,
    title: "DSA",
    image: "assets/courses/dsa.png",
    description:
      " Sharpen your problem-solving skills. Learn DSA to crack coding interviews and write optimized, efficient code.",
  },
  {
    id: 5,
    title: "C++",
    image: "assets/courses/c++.png",
    description:
      "Make your web pages come alive! JavaScript lets you build interactive, dynamic, and responsive websites with ease.",
  },
  {
    id: 6,
    title: "JS",
    image: "assets/courses/js.png",
    description:
      "Boost your coding fundamentals with C++. Dive deep into memory management, OOP, and performance-critical applications.",
  },
];

// Initialize Lucide icons
lucide.createIcons();

// Create cards
const cardsContainer = document.querySelector(".cards");
let activeCard = null;

function createCard(card) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";
  cardElement.onclick = () => handleCardClick(card);

  // Solid color background with centered title
  cardElement.innerHTML = `
    <div class="card-inner" style="background-color: rgba(62, 74, 117, 0.35); display: flex; justify-content: center; align-items: center;">
      <h3 class="card-title" style="color: white; font-size: 1.25rem;">${card.title}</h3>
    </div>
  `;

  return cardElement;
}

function renderCards() {
  cardsContainer.innerHTML = "";
  cards.forEach((card) => {
    cardsContainer.appendChild(createCard(card));
  });
  lucide.createIcons();
}

function handleCardClick(card) {
  activeCard = card;
  updateContent();

  // Move clicked card to end
  const cardIndex = cards.findIndex((c) => c.id === card.id);
  const clickedCard = cards.splice(cardIndex, 1)[0];
  cards.push(clickedCard);

  renderCards();
}

function updateContent() {
  const defaultContent = document.querySelector(".default-content");
  const locationContent = document.querySelector(".location-content");
  const backgroundImage = document.querySelector(".background-image");

  if (activeCard) {
    defaultContent.classList.add("hidden");
    locationContent.classList.remove("hidden");

    // Update content
    locationContent.querySelector(".location").textContent =
      activeCard.location;
    locationContent.querySelector(".title").textContent = activeCard.title;
    locationContent.querySelector(".description").textContent =
      activeCard.description;

    // Update background
    backgroundImage.style.backgroundImage = `url('${activeCard.image}')`;
  } else {
    defaultContent.classList.remove("hidden");
    locationContent.classList.add("hidden");
    backgroundImage.style.backgroundImage = `url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=1920')`;
  }
}

function scrollLeft() {
  const firstCard = cards.shift();
  cards.push(firstCard);
  renderCards();
}

function scrollRight() {
  const lastCard = cards.pop();
  cards.unshift(lastCard);
  renderCards();
}

// Initial render
renderCards();
