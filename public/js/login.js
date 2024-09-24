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
        showModal(signupModal);
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
        showModal(loginModal);
        hideModal(signupModal);
    });
});
window.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    // const mainContent = document.getElementById('main-content');

    splashScreen.addEventListener('click', () => {
        splashScreen.style.transform = 'translateY(-100%)';
        // mainContent.classList.add('active');
    });
});



document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent default form submission

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)  // Convert form data to JSON string
    }).then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            return response.text();
        }
    }).then(text => {
        if (text) {
            alert(text);  // Show error message
        }
    }).catch(error => {
        console.error('Error:', error);
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const pfNumberInput = document.getElementById('pf_number');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const termsCheckbox = document.querySelector('input[name="terms"]');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', (event) => {
        let isValid = true;
        let errors = [];

        // Clear previous error messages
        errorMsg.innerHTML = '';

        // Validate PF number (Example: should be numeric and exactly 5 digits long)
        const pfNumber = pfNumberInput.value.trim();
        // if (!/^\d{5}$/.test(pfNumber)) {
        //     isValid = false;
        //     errors.push('PF Number must be exactly 5 digits long.');
        // }

        // Validate password
        const password = passwordInput.value.trim();
        if (!/^(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
            isValid = false;
            errors.push('Password must be at least 8 characters long and contain at least one number.');
        }

        // Check if passwords match
        const confirmPassword = confirmPasswordInput.value.trim();
        if (password !== confirmPassword) {
            isValid = false;
            errors.push('Passwords do not match.');
        }

        // Check if the terms and privacy policy checkbox is checked
        if (!termsCheckbox.checked) {
            isValid = false;
            errors.push('You must accept the Terms and Privacy Policy.');
        }

        // Display errors and prevent form submission if any validation fails
        if (!isValid) {
            errorMsg.innerHTML = errors.join('<br>');
            event.preventDefault();
        }
    });
});



