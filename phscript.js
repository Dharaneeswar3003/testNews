let articles = [];

// Fetch articles from Google Sheets API
async function fetchArticles() {
    try {
        const sheetID = "1c8v1J5hhyKN72zRbhwtkgsw558JJKKm7EKQ0lb-ZbVo";
        const apiKey = "AIzaSyAc04F5b2l3-BhRNO3em_RcY6tnCng40X0"; 
        const range = "Form Responses 1!A1:I100";

        const script = document.createElement('script');
        script.src = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${range}?key=${apiKey}&callback=handleArticlesResponse`;
        document.head.appendChild(script);

    } catch (error) {
        console.error("Error fetching articles:", error);
    }
    console.log(articles);
}

function handleArticlesResponse(response) {
    if (!response.values || response.values.length < 2) {
        console.error("No valid data found in Google Sheets.");
        return;
    }

    const headers = response.values[0]; // First row contains column headers
    const dataRows = response.values.slice(1); // Remaining rows contain article data

    // Ensure articles are populated correctly, using index as ID
    articles = dataRows.map((row, index) => {
        let articleObject = {};
        headers.forEach((header, idx) => {
            articleObject[header.toLowerCase()] = row[idx] || ""; // Store data using lowercase keys
        });
        articleObject.id = index + 1; // Set the ID to the index (starting from 1)
        return articleObject;
    });

    if (articles.length === 0) {
        console.error("No articles to display.");
        return;
    }

    // Store in localStorage for caching
    localStorage.setItem("articles", JSON.stringify(articles));
    console.log("Articles fetched from Google Sheets API and cached.");
    console.log(articles);

    handlePageLoad();
}

// Load articles when the page loads
document.addEventListener("DOMContentLoaded", fetchArticles);


// Handle loading articles depending on the current page
function handlePageLoad() {
    const currentPage = getCurrentPage();

    if (currentPage === "home") {
        loadArticles("home", "home-articles");
        setupMoreArticlesButton();
    } else if (currentPage === "news") {
        loadArticles("School News", "schoolnews-articles");
        loadArticles("Local News", "localnews-articles");
    } else if (currentPage === "features") {
        loadArticles("Features", "features-articles");
    } else if (currentPage === "allarticles") {
        loadArticles("all", "all-articles");
    } else if (currentPage === "article") {
        loadArticlePage();
    }
}

// Function to determine current page
function getCurrentPage() {
    const path = window.location.pathname.split("/").pop().toLowerCase();
    if (!path || path === "index.html") return "home";
    return path.replace(".html", "");
}


function loadArticles(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found.`);
        return;
    }
    container.innerHTML = ''; // Clear existing content

    // Sort articles by ID (latest first)
    const sortedArticles = [...articles].sort((a, b) => b.id - a.id);

    let filteredArticles;
    if (category === "home") {
        filteredArticles = sortedArticles.slice(0, 10);
    } else if (category === "all") {
        filteredArticles = sortedArticles;
    } else {
        filteredArticles = sortedArticles.filter(article => {
            const articleCategories = article.category.split(",").map(cat => cat.trim());
            return articleCategories.includes(category);
        });
    }

    if (filteredArticles.length === 0) {
        container.innerHTML = '<p>No articles found for this section.</p>';
        return;
    }

    filteredArticles.forEach(article => {
        const articleDiv = document.createElement('div');
        articleDiv.classList.add('article');
    
        // Ensure the image URL is using the export=view format
        let validImageUrl = article.image ? article.image : 'default-image.jpg';
        
        if (validImageUrl.includes("drive.google.com")) {
            validImageUrl = validImageUrl
                .replace("open", "thumbnail") // Convert to export format
                + "&sz=s1000";
        }

        articleDiv.innerHTML = `
            <div class="image-container">
                <img src="${validImageUrl}" class="article-image" loading="lazy" alt="${article.title}"
                    onerror="this.onerror=null; this.src='default-image.jpg';">
            </div>
            <div class="article-details">
                <h3 class="article-category">${article.category}</h3>
                <h5 class="article-title">${article.title}</h5>
                <p class="article-description">${article.description}</p>
            </div>
        `;
    
        // Add event listener to navigate to the full article page on click
        articleDiv.addEventListener('click', () => {
            const currentPage = window.location.pathname.split("/").pop().toLowerCase();
            const articlePagePath = currentPage === "index.html" || currentPage === ""
                ? `Pages/article.html?id=${article.id}`
                : `article.html?id=${article.id}`;
            window.location.href = articlePagePath;
        });
    
        container.appendChild(articleDiv);
    });    
}

function loadArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const articleId = parseInt(params.get('id')); // Get the id from URL

    if (!articles.length) {
        setTimeout(loadArticlePage, 100); // Retry if data isn't loaded yet
        return;
    }

    // Find the correct article by converting the ID to the index (id - 1)
    const articleIndex = articleId - 1;
    const article = articles[articleIndex]; // Get the article by its index

    if (article) {
        document.querySelector('.article-title').textContent = article.title;
        const imageElement = document.querySelector('.article-image');

        // Check if the article has an image
        if (article.image) {
            let validImageUrl = article.image ? article.image : 'default-image.jpg';
        
        if (validImageUrl.includes("drive.google.com")) {
            validImageUrl = validImageUrl
                .replace("open", "thumbnail") // Convert to export format
                + "&sz=s1000";
        }

            // Set the image source to the thumbnail URL
            imageElement.src = validImageUrl;
            imageElement.alt = article.title;
        } else {
            console.log("No image found for this article.");
            imageElement.style.display = "none"; // Hide the image if no image is available
        }
    } else {
        window.location.href = '../index.html'; // Redirect if article not found
    }
}



// Hamburger Menu Functionality
function setupHamburgerMenu() {
    const hamburgerButton = document.getElementById('hamburger-button');
    const closeButton = document.getElementById('close-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerButton && mobileMenu && closeButton) {
        hamburgerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('visible');
            mobileMenu.classList.toggle('hidden');
        });

        closeButton.addEventListener('click', () => {
            mobileMenu.classList.remove('visible');
            mobileMenu.classList.add('hidden');
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const href = link.getAttribute('href');
                mobileMenu.classList.remove('visible');
                mobileMenu.classList.add('hidden');
                window.location.href = href;
            });
        });
    }
}

// 'More Articles' button functionality
function setupMoreArticlesButton() {
    const moreArticlesButton = document.getElementById('more-articles');
    if (!moreArticlesButton) {
        console.error('More Articles button not found.');
        return;
    }

    moreArticlesButton.addEventListener('click', () => {
        window.location.href = "Pages/Allarticles.html";
    });
}

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupHamburgerMenu();
});


/*


// Load the Google API client library
function loadClient() {
    gapi.client.setApiKey('AIzaSyAc04F5b2l3-BhRNO3em_RcY6tnCng40X0');  // Replace with your actual API key
    return gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1')
      .then(function() {
        console.log("GAPI client loaded for API");
      }, function(error) {
        console.error("Error loading GAPI client", error);
      });
}
  
// Initialize Google API client
function initialize() {
    gapi.load('client', loadClient);
}
  
// Fetch and convert Google Doc to HTML
function fetchGoogleDocContent(docId) {
    return gapi.client.docs.documents.get({
      documentId: docId
    }).then(function(response) {
      const docContent = response.result.body.content;
      const htmlContent = convertDocToHTML(docContent);
      // Store the converted HTML in localStorage or a global variable
      localStorage.setItem('articleHTML', htmlContent);
      console.log("HTML content stored in localStorage");
    }, function(error) {
      console.error("Error fetching document:", error);
    });
}
  
// Convert Google Docs content to HTML
function convertDocToHTML(content) {
    let html = "";
    content.forEach(function(element) {
      if (element.paragraph) {
        let paragraphText = "";
        element.paragraph.elements.forEach(function(paragraphElement) {
          if (paragraphElement.textRun) {
            let text = paragraphElement.textRun.content;
            let attributes = paragraphElement.textRun.textStyle;
            
            // Handle bold, italic, underline and other text formatting
            if (attributes.bold) {
              text = "<b>" + text + "</b>";
            }
            if (attributes.italic) {
              text = "<i>" + text + "</i>";
            }
            if (attributes.underline) {
              text = "<u>" + text + "</u>";
            }
            
            paragraphText += text;
          }
        });
        
        // Wrap paragraph in <p> tag
        html += "<p>" + paragraphText + "</p>";
      }
    });
    return html;
}
  
// Helper function to extract the Google Doc ID from the URL
function extractDocIdFromUrl(url) {
    const regex = /\/d\/(.*?)(?=\/|$)/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
}
  
// Initialize the script
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const articleId = parseInt(params.get('id'));  // Get article ID
    console.log(articleId);
    const articleData = articles[articleId - 1]; 
    console.log(articleData);
  
    if (articleData && articleData['article document']) {
      let docUrl = articleData['article document'];  // Get the Google Doc URL from articleData

      // Modify the URL to the correct API format
      if (docUrl.includes("drive.google.com/open?id=")) {
        docUrl = docUrl.replace("drive.google.com/open?id=", "docs.googleapis.com/v1/documents/");  // Replace the open part with the API endpoint
      }

      const docId = extractDocIdFromUrl(docUrl);  // Extract the Google Doc ID from URL
      if (docId) {
        fetchGoogleDocContent(docId);  // Fetch and convert the document content
      } else {
        console.error("Invalid document ID");
      }
    } else {
      console.error("No document link found in article data");
    }
});

*/
