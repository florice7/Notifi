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

document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');

    const closeLoginModalButton = document.getElementById('close-login-modal');
    const closeSignupModalButton = document.getElementById('close-signup-modal');

    const openLoginModalButton = document.getElementById('open-login-modal');
    const openSignupModalButton = document.getElementById('open-signup-modal');

    const loginIcon = document.getElementById('login-icon');
    const goToLoginLink = document.getElementById('go-to-login');
    const goToSignupLink = document.getElementById('go-to-signup');

    // Show and hide modals
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Open Login Modal
    openLoginModalButton?.addEventListener('click', function(event) {
        event.preventDefault();
        showModal(loginModal);
    });

    // Open Signup Modal
    openSignupModalButton?.addEventListener('click', function(event) {
        event.preventDefault();
        showModal(signupModal);
    });

    // Switch to Signup Modal from Login Modal
    goToSignupLink.addEventListener('click', function(event) {
        event.preventDefault();
        hideModal(loginModal);
        showModal(signupModal);
    });

    // Switch to Login Modal from Signup Modal
    goToLoginLink.addEventListener('click', function(event) {
        event.preventDefault();
        hideModal(signupModal);
        showModal(loginModal);
    });

    // Hide Login Modal
    closeLoginModalButton.addEventListener('click', function() {
        hideModal(loginModal);
    });

    // Hide Signup Modal
    closeSignupModalButton.addEventListener('click', function() {
        hideModal(signupModal);
    });

    // Close modals if clicking outside of them
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            hideModal(loginModal);
        } else if (event.target === signupModal) {
            hideModal(signupModal);
        }
    });

    // Open Signup Modal from the login icon
    loginIcon?.addEventListener('click', function(event) {
        event.preventDefault();
        hideModal(loginModal);
        showModal(signupModal);
    });
});
