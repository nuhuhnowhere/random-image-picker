let IMAGES = []; // Will store image objects with a weight property
let pickedImageHistory = []; // Will put all picked images in this
const ROUNDS = 1; // Amount of rounds the carousel will shift trough
const CAROUSEL_TIME = 5; // Total time in seconds carousel will spin

function loadImages() {
    $("#start-button").prop("disabled", false);
    $("#yourimagestitle").html("Selected images");
    $("#random-image-div").css("display", "none");
    const images = $("#images");

    for (let file of document.getElementById("imagesInput").files) {
        let oFReader = new FileReader();
        oFReader.readAsDataURL(file);

        oFReader.onload = function (oFREvent) {
            data = images.html();
            data += `<img alt="imagepicker.org carousel image" class="img-thumbnail thumbnail" src="${oFREvent.target.result}">`;
            $("#images").html(data);
            // Each image has a weight, for example, default 1
            IMAGES.push({ src: oFREvent.target.result, weight: 1 });
        };
    }

    pa.track({name: "Load images", value: IMAGES.length});
}

// Function to set the weight of an image
function setImageWeight(imageIndex, weight) {
    IMAGES[imageIndex].weight = weight;
}

// Example: Update weight of selected image
function updateImageWeight() {
    const imageIndex = getSelectedImageIndex();  // Implement logic to get index of the selected image
    const weight = document.getElementById("image-weight-input").value;
    setImageWeight(imageIndex, parseInt(weight, 10));
}

function pickRandomImage() {
    $("#reset-button").prop("disabled", false);
    $("#pick-button").prop("disabled", true);

    const deleteImage = $("#delete-image")[0].checked;
    const directly = $("#show-directly")[0].checked;

    if (!IMAGES.length) {
        $("#information-text").html("No images left");
        $("#random-image-div").css("display", "none");
    } else {
        // Weighted random selection
        const selected = pickWeightedRandomImage();
        if (directly) {
            setFinalImage(selected, deleteImage);
        } else {
            doCarousel(selected, deleteImage);
        }
    }
}

function pickWeightedRandomImage() {
    const totalWeight = IMAGES.reduce((sum, image) => sum + image.weight, 0);
    const randomWeight = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    for (let i = 0; i < IMAGES.length; i++) {
        cumulativeWeight += IMAGES[i].weight;
        if (randomWeight < cumulativeWeight) {
            return i;  // Return the index of the selected image
        }
    }
    return IMAGES.length - 1;  // Fallback (shouldn't really hit this line)
}

function updateImageWeight() {
    const indexInput = document.getElementById("image-index-input");
    const weightInput = document.getElementById("image-weight-input");

    const imageIndex = parseInt(indexInput.value, 10);
    const weight = parseInt(weightInput.value, 10);

    if (
        isNaN(imageIndex) ||
        isNaN(weight) ||
        imageIndex < 0 ||
        imageIndex >= IMAGES.length ||
        weight < 1
    ) {
        alert("Please enter a valid image index and weight (1 or higher).");
        return;
    }

    IMAGES[imageIndex].weight = weight;
    alert(`Set weight of image #${imageIndex} to ${weight}`);
}

function doCarousel(selected, deleteImage) {
    pa.track({name: "Do Carousel", value: IMAGES.length});
    const totalCarousel = ROUNDS * IMAGES.length + selected; // Total images that will be shown in carousel
    const durations = computeDurations(totalCarousel); // Compute a list of durations for each image display in the carousel
    doCarouselRec(0, durations, deleteImage);
}

function doCarouselRec(index, durations, deleteImage) {
    index = index % IMAGES.length;
    const randomImage = $("#random-image");
    $("#random-image-div").css("display", "");

    if (durations.length > 0) {
        randomImage.prop("src", IMAGES[index]);
        randomImage.removeClass("random-selected");

        const duration = durations.shift();
        setTimeout(function () {
            doCarouselRec(index + 1, durations, deleteImage);
        }, duration * 1000);
    } else {
        // Freeze and remove image from list
        setFinalImage(index, deleteImage);
    }
}

function computeDurations(steps) {
    const times = [];
    for (let i = steps; i > 0; i -= 1) {
        times.push(f(i, steps));
    }
    return times;
}

/**
 * Some beautiful math to create a increasing-time effect in the carousel spin
 */
function f(x, steps) {
    sigm = 0;
    for (let i = 1; i <= steps; i += 1) {
        sigm += Math.log(i);
    }
    a = CAROUSEL_TIME / (steps * Math.log(steps) - sigm);
    c = (CAROUSEL_TIME * Math.log(steps)) / (steps * Math.log(steps) - sigm);
    return -a * Math.log(x) + c;
}

function deleteSelectedImage(index) {
    IMAGES.splice(index, 1);
}

function setFinalImage(index, deleteImage) {
    let randomImage = $("#random-image");
    $("#random-image-div").css("display", "");
    randomImage.prop("src", IMAGES[index]);
    randomImage.addClass("random-selected");
    $("#pick-button").prop("disabled", false);

    const history = $("#show-history")[0].checked;
    if (history) {
        pickedImageHistory.push(IMAGES[index]);
        updatePickedImages();
    }

    if (deleteImage) {
        deleteSelectedImage(index);
    }
}

function updatePickedImages() {
    const historyContainer = $("#history-container");

    if (historyContainer.find(".history-image-wrapper").length === 0) {
        historyContainer.empty();
        historyContainer.append(`
            <div class="col-12 mb-4 history-image-wrapper">
                <img class="img-thumbnail history-image" src="${
            pickedImageHistory[pickedImageHistory.length - 1]
        }" alt="Previously picked image ${pickedImageHistory.length}">
            </div>
        `);
    } else {
        historyContainer.find(".history-image-wrapper").first().before(`
            <div class="col-12 mb-2 history-image-wrapper">
                <img class="img-thumbnail history-image" src="${
            pickedImageHistory[pickedImageHistory.length - 1]
        }" alt="Previously picked image ${pickedImageHistory.length}">
            </div>
        `);
    }
}

function start() {
    $(`#step-1`).each(function () {
        $(this).css("display", "none");
    });
    $(`#step-2`).each(function () {
        $(this).css("display", "");
    });
    $(`.step-1-clear`).each(function () {
        $(this).html("");
    });
    $(`#history`).each(function () {
        if ($("#show-history")[0].checked) {
            $(this).css("display", "");
        }
    });

    if (!IMAGES.length) {
        $("#information-text").html("No images left");
        $("#reset-button").prop("disabled", false);
        $("#pick-button").prop("disabled", true);
        $("#random-image-div").css("display", "none");
    } else {
        $("#pick-button").prop("disabled", false);
        $("#reset-button").prop("disabled", true);
    }
}

function reset() {
    IMAGES = [];

    pickedImageHistory = [];
    const historyContainer = $(`#history-container`);
    historyContainer.empty();
    historyContainer.html(`<div id="history-container">No history to show.</div>`);

    $(`#step-1`).each(function () {
        $(this).css("display", "");
    });
    $('#step-2').each(function () {
        $(this).attr('style', 'display: none');
    });
    $(`.step-2-clear`).each(function () {
        $(this).html("");
    });
    $(`#history`).each(function () {
        $(this).css("display", "none");
    });
    $("#reset-button").prop("disabled", true);
    $("#start-button").prop("disabled", true);
}
