window.addEventListener("load", function() {
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        document.getElementById("loaderContainer").classList.add("loaderContainer2");

        setTimeout(() => {
            document.body.style.overflow = "auto";
        }, 300);
    }, 500);
});
