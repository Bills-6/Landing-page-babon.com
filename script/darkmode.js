const openNavButton = document.getElementById("open-navbar");
const navbar = document.getElementById("navlist");
const closeNavButton = document.getElementById("close-navbar");

openNavButton.addEventListener("click", function() {
	callNav("open")
});
closeNavButton.addEventListener("click", function() {
	callNav("close")
});

function callNav(is) {
	if (is === "open") {
		navbar.classList.replace("right-[-100%]", "right-0");
	} else {
		navbar.classList.replace("right-0", "right-[-100%]");
	}
}

// darkmode script
const body = document.body;

const darkmodeMobile = document.getElementById("darkmode-button-mobile"),
	iconDarkmodeMoonMobile = document.getElementById("icon-darkmode-mobile"),
	iconDarkmodeSunMobile = document.getElementById("icon-darkmode-sun-mobile");
const darkmodeLarge = document.getElementById("")

function EngineTheme(is) {
	// take information data-theme in body
	const themeBody = body.dataset.theme;
	
	if (themeBody === "dark") {
		body.classList.replace("bg-slate-700", "bg-[unset]");
		body.dataset.theme = "light";

		iconDarkmodeSunMobile.classList.replace("hidden", "block");
		iconDarkmodeMoonMobile.classList.add("hidden");
	} else {
		body.classList.replace("bg-[unset]", "bg-slate-700");
		body.dataset.theme = "dark";
	}
}

darkmodeMobile.addEventListener("click", function() {
	EngineTheme();
});