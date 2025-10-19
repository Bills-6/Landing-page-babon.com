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

function EngineTheme(is) {
	// take information data-theme in body
	let themeBody = body.dataset.theme;
	
	if (themeBody === "dark") {
		body.classList.replace("bg-slate-700", "bg-[unset]");
	} else {
		body.classList.replace("bg-[unset]", "bg-slate-700");
	}
}

const darkmodeMobile = document.getElementById("darkmode-button-mobile"),
	iconDarkmodeMobile = document.getElementById("icon-darkmode-mobile");
const darkmodeLarge = document.getElementById("")

darkmodeMobile.addEventListener("click", function() {
	EngineTheme();
});