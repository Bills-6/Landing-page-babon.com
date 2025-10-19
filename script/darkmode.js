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