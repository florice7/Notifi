function revealFlashcards() {
    const flashcardsContainer = document.querySelector('.flashcards-container');
    const closeIcon = document.querySelector('.close-icon');
    flashcardsContainer.classList.add('visible');
    flashcardsContainer.classList.remove('hidden');
    closeIcon.style.display = 'block';
}

function hideFlashcards() {
    const flashcardsContainer = document.querySelector('.flashcards-container');
    const closeIcon = document.querySelector('.close-icon');
    flashcardsContainer.classList.remove('visible');
    flashcardsContainer.classList.add('hidden');
    closeIcon.style.display = 'none';
}

// scripts.js

document.addEventListener('DOMContentLoaded', function() {
    const openModalButton = document.getElementById('open-login-modal');
    const closeModalButton = document.getElementById('close-login-modal');
    const modal = document.getElementById('login-modal');

    // Show modal
    openModalButton.addEventListener('click', function() {
        modal.style.display = 'flex'; // Show the modal
    });

    // Hide modal
    closeModalButton.addEventListener('click', function() {
        modal.style.display = 'none'; // Hide the modal
    });

    // Close modal if clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Hide the modal
        }
    });
});


document.getElementById('login-icon').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    document.getElementById('login-modal').style.display = 'flex';
});

document.getElementById('close-login-modal').addEventListener('click', function() {
    document.getElementById('login-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
