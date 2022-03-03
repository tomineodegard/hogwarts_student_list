"use strict";
// let students;
let studentArray = [];
let allBloodTypes = [];
let filteredStudents;

// ----- the setting is making sure the filter and sort functions have a default
const settings = {
  filterBy: "all",
  sortBy: "firstName",
  sortDir: "asc",
};

window.addEventListener("DOMContentLoaded", start);

// ________________ START FUNCTION ________________
function start() {
  console.log("Start");
  registerButtons();
  getJson();
}

// ________________ GET JSON ________________
async function getJson() {
  console.log("getJson");
  const students = await getStudentJson();
  allBloodTypes = await getBloodJson();

  // ----- race conditions with two async functions, making sure the students are loaded before the bloodtype-json
  async function getStudentJson() {
    console.log("getStudentJson");
    const url = "https://petlatkea.dk/2021/hogwarts/students.json";
    let data = await fetch(url);
    const students = await data.json();
    return students;
  }
  async function getBloodJson() {
    console.log("getBloodJson");
    const url = "https://petlatkea.dk/2021/hogwarts/families.json";
    let data = await fetch(url);
    const bloodTypes = await data.json();
    return bloodTypes;
  }
  createStudents(students);
}

// ________________ REGISTRER BUTTONS ________________
function registerButtons() {
  document.querySelectorAll("[data-action='filter']").forEach((button) => button.addEventListener("click", selectFilter));
  document.querySelectorAll("[data-action='sort']").forEach((button) => button.addEventListener("click", selectSort));
}

function createStudents(data) {
  studentArray = data.map(prepareObject);
  buildList();
}

// ________________ CREATE THE STUDENT OBJECT, WITH CLEANED/TRIMMED/PREPARED DATA ________________
function prepareObject(object) {
  const Student = {
    prefect: false,
    firstName: "",
    lastName: "",
    middleName: "",
    nickName: "",
    image: "",
    house: "",
    gender: "",
    star: false,
    bloodType: "",
    inquisitorial: false,
    expelled: false,
  };

  const student = Object.create(Student);

  // ----- Trim all the objects
  let originalName = object.fullname.trim();
  let originalHouse = object.house.trim();
  let originalGender = object.gender.trim();

  // ----- Cleaning first name
  if (originalName.includes(" ")) {
    student.firstName = originalName.substring(originalName.indexOf(0), originalName.indexOf(" "));
  } else {
    student.firstName = originalName.substring(originalName.indexOf(0));
  }
  student.firstName = student.firstName.substring(0, 1).toUpperCase() + student.firstName.substring(1).toLowerCase();

  // ----- Cleaning middle name
  student.middleName = originalName.substring(originalName.indexOf(" ") + 1, originalName.lastIndexOf(" "));
  student.middleName = student.middleName.substring(0, 1).toUpperCase() + student.middleName.substring(1).toLowerCase();

  //----- Cleaning nickname
  if (originalName.includes('"')) {
    student.middleName = " ";
    student.nickName = originalName.substring(originalName.indexOf('"') + 1, originalName.lastIndexOf('"'));
  }

  // ----- Cleaning last name
  if (originalName.includes(" ")) {
    student.lastName = originalName.substring(originalName.lastIndexOf(" ") + 1);
    student.lastName = student.lastName.substring(0, 1).toUpperCase() + student.lastName.substring(1).toLowerCase();
  }

  // ----- Cleaning house
  student.house = originalHouse;
  student.house = student.house.substring(0, 1).toUpperCase() + student.house.substring(1).toLowerCase();

  // ----- Cleaning gender
  student.gender = originalGender;
  student.gender = student.gender.substring(0, 1).toUpperCase() + student.gender.substring(1).toLowerCase();

  // ----- Cleaning images
  let studentPicture = new Image();
  studentPicture.scr = "images/" + student.lastName + ".png";
  student.image = studentPicture.scr;

  // ----- Cleaning the blood types
  // let originalBlood = student.bloodType;
  // student.bloodType = originalBlood;
  // originalBlood.replace("_", " ");

  // ----- Call function that calculates blood
  student.bloodType = findBloodType(student);

  return student;
}

// ----- Calculate the bloodtype
function findBloodType(student) {
  const pureBlood = allBloodTypes.pure.includes(student.lastName);
  if (pureBlood === true) {
    return "pure_blood";
  }

  const halfBlood = allBloodTypes.half.includes(student.lastName);
  if (halfBlood === true) {
    return "half_blood";
  }

  return "muggle";
}

// ________________ DISPLAYING THE STUDENT LIST ________________
function displayList(list) {
  document.querySelector("#student_list tbody").innerHTML = "";
  list.forEach((student) => displayStudent(student));
}

// ________________ DEFINE AND APPEND THE STUDENT-OBJECTS ________________
function displayStudent(student) {
  const clone = document.querySelector("template#student").content.cloneNode(true);

  clone.querySelector("[data-field=firstName]").textContent = student.firstName;
  clone.querySelector("[data-field=lastName]").textContent = student.lastName;
  clone.querySelector("[data-field=house]").textContent = student.house;
  clone.querySelector("#read_more_button").addEventListener("click", () => showPopUp(student));

  // ----- Prefects
  clone.querySelector("[data-field=prefect]").dataset.prefect = student.prefect;
  clone.querySelector("[data-field=prefect]").addEventListener("click", clickPrefect);
  function clickPrefect() {
    if (student.prefect === true) {
      student.prefect = false;
    } else {
      tryToMakePrefect(student);
    }
    buildList();
  }

  // ----- Inquisitorial squad symbols
  if (student.inquisitorial === true) {
    clone.querySelector("[data-field=inquisitorial]").textContent = "🎖";
  } else {
    clone.querySelector("[data-field=inquisitorial]").textContent = "☆";
  }

  // ----- Inquisitorial squad rules applied
  clone.querySelector("[data-field=inquisitorial]").dataset.inquisitorial = student.inquisitorial;
  clone.querySelector("[data-field=inquisitorial]").addEventListener("click", tryToMakeInquisitorial);

  function tryToMakeInquisitorial() {
    if (student.bloodType === "pure_blood") {
      if (student.inquisitorial === true) {
        student.inquisitorial = false;
      } else {
        student.inquisitorial = true;
      }
      buildList();
    } else {
      inquisitorialPopUp();
    }
  }

  document.querySelector("#student_list tbody").appendChild(clone);
}

function inquisitorialPopUp() {
  document.querySelector("#only_pureblood").classList.remove("hide");
  document.querySelector("#only_pureblood .close_button").addEventListener("click", closeInquisitorialPopUp);
}

function closeInquisitorialPopUp() {
  document.querySelector("#only_pureblood").classList.add("hide");
}

// ________________ BUILDING A NEW LIST  ________________
//  ----- this function takes care of both filtering and sorting
function buildList() {
  const currentList = filterList(studentArray);
  const sortedList = sortList(currentList);
  displayList(sortedList);
}

// ________________ FILTERING ________________
// ----- Filtering function which takes a filtering function as an argument
function prepareData(filter) {
  filteredStudents = studentArray.filter(filter);
  return filteredStudents;
}

// ----- list of filter options
function filterList(filteredList) {
  if (settings.filterBy === "gryffindor") {
    filteredList = studentArray.filter(filterGryffindor);
  } else if (settings.filterBy === "slytherin") {
    filteredList = studentArray.filter(filterSlytherin);
  } else if (settings.filterBy === "hufflepuff") {
    filteredList = studentArray.filter(filterHufflepuff);
  } else if (settings.filterBy === "ravenclaw") {
    filteredList = studentArray.filter(filterRavenclaw);
  } else if (settings.filterBy === "boys") {
    filteredList = studentArray.filter(filterBoys);
  } else if (settings.filterBy === "girls") {
    filteredList = studentArray.filter(filterGirls);
  } else if (settings.filterBy === "pure_blood") {
    filteredList = studentArray.filter(filterPureblood);
  } else if (settings.filterBy === "half_blood") {
    console.log(settings.filterBy);
    filteredList = studentArray.filter(filterHalfblood);
  } else if (settings.filterBy === "inquisitorial") {
    filteredList = studentArray.filter(filterInquisitorial);
  } else if (settings.filterBy === "prefect") {
    filteredList = studentArray.filter(filterPrefect);
  }

  return filteredList;
}

// ----- the user picks a filter, and this is stored in the filter-variable, then sending this as a parameter to call setFilter function
function selectFilter(userEvent) {
  const filter = userEvent.target.dataset.filter;
  setFilter(filter);
}

// ----- refering to the settings variable, and using the filter argument from selectFilter
function setFilter(filter) {
  settings.filterBy = filter;
  buildList();
  console.log(`Chosen filter: ${filter}`);
}

// -------- all filter functions
function filterGryffindor(student) {
  return student.house === "Gryffindor";
}
function filterSlytherin(student) {
  return student.house === "Slytherin";
}
function filterHufflepuff(student) {
  return student.house === "Hufflepuff";
}
function filterRavenclaw(student) {
  return student.house === "Ravenclaw";
}
function filterBoys(student) {
  return student.gender === "Boy";
}
function filterGirls(student) {
  return student.gender === "Girl";
}
function filterPureblood(student) {
  return student.bloodType === "pure_blood";
}
function filterHalfblood(student) {
  return student.bloodType === "half_blood";
}
function filterInquisitorial(student) {
  return student.inquisitorial === true;
}
function filterPrefect(student) {
  return student.prefect === true;
}

// ________________ ALL SORTING FUNCTIONS ________________
// -------- sorting options
function selectSort(event) {
  const sortBy = event.target.dataset.sort;
  const sortDir = event.target.dataset.sortDirection;
  console.log("Sorting by:", sortBy, "- in the sort direction:", sortDir);

  setSorting(sortBy, sortDir);
}

function setSorting(sortBy, sortDir) {
  settings.sortBy = sortBy;
  settings.sortDir = sortDir;
  buildList();
}

function sortList(sortedList) {
  let direction = 1;
  if (settings.sortDir === "desc") {
    direction = -1;
  } else {
  }

  sortedList = sortedList.sort(compareSortOption);

  // -------- the compare function compares two elements and return its opinion on which element should be first when sorted
  function compareSortOption(a, b) {
    if (a[settings.sortBy] < b[settings.sortBy]) {
      return -1 * direction;
    } else {
      return 1 * direction;
    }
  }
  return sortedList;
}

// ________________ SEARCH ________________
//  -------- TO DO: search
// function search() {}

// ________________ MORE FILTER FUNCTIONS ________________
function filterExpelled() {}
function filterMuggle() {}

// ________________ ALL PREFECT TOGGLE FUNCTIONS ________________
function tryToMakePrefect(selectedStudent) {
  const prefects = studentArray.filter((student) => student.prefect && student.house === selectedStudent.house);
  const numberOfPrefects = prefects.length;

  if (numberOfPrefects >= 2) {
    console.log("WARNING! there can only be two prefects from each house");
    removeAorB(prefects[0], prefects[1]);
  } else {
    makePrefect(selectedStudent);
  }

  function removeAorB(prefectA, prefectB) {
    // -------- Ask user to ignore or remove prefectA or prefectB
    document.querySelector("#remove_aorb").classList.remove("hide");
    document.querySelector("#remove_aorb .close_button").addEventListener("click", closePrefectWarning);
    document.querySelector("#remove_aorb #remove_a").addEventListener("click", clickRemoveA);
    document.querySelector("#remove_aorb #remove_b").addEventListener("click", clickRemoveB);

    // -------- Display names on prefects
    document.querySelector("#remove_aorb [data-field=prefectA]").textContent = prefectA.firstName;
    document.querySelector("#remove_aorb [data-field=prefectB]").textContent = prefectB.firstName;

    // -------- If the user ignores it - do nothing
    function closePrefectWarning() {
      document.querySelector("#remove_aorb").classList.add("hide");
      document.querySelector("#remove_aorb .close_button").removeEventListener("click", closePrefectWarning);
      document.querySelector("#remove_aorb #remove_a").removeEventListener("click", clickRemoveA);
      document.querySelector("#remove_aorb #remove_b").removeEventListener("click", clickRemoveB);
    }

    // -------- User would like to remove prefectA
    function clickRemoveA() {
      removePrefect(prefectA);
      makePrefect(selectedStudent);
      buildList();
      closePrefectWarning();
    }

    // -------- User would like to remove prefectB
    function clickRemoveB() {
      removePrefect(prefectB);
      makePrefect(selectedStudent);
      buildList();
      closePrefectWarning();
    }
  }

  function removePrefect(student) {
    student.prefect = false;
  }

  function makePrefect(student) {
    student.prefect = true;
  }
}

// ________________ POPUP/MORE DETAILS ________________
function showPopUp(student) {
  document.querySelector("#pop_up").classList.remove("hide");

  document.querySelector("#pop_up .close_button").addEventListener("click", closePopUp);

  document.querySelector("#pop_up .fullName").textContent = student.firstName + " " + student.nickName + " " + student.middleName + " " + student.lastName;
  document.querySelector("#pop_up .firstName").textContent = "First name:" + " " + student.firstName;
  document.querySelector("#pop_up .lastName").textContent = "Last name:" + " " + student.lastName;

  // ----- Only show nick name if any
  if (student.nickName === "") {
    document.querySelector("#pop_up .nickName").textContent = student.nickName;
  } else {
    document.querySelector("#pop_up .nickName").textContent = "Nick name:" + " " + student.nickName;
  }

  // ----- Only show middle name if any
  if (student.middleName === " " || student.middleName === "") {
    document.querySelector("#pop_up .middleName").textContent = student.middleName;
  } else {
    document.querySelector("#pop_up .middleName").textContent = "Middle name:" + " " + student.middleName;
  }

  // ----- Show if prefect or not
  if (student.prefect === true) {
    document.querySelector("#pop_up .status").textContent = "This student is a prefect.";
  } else if (student.prefect === false) {
    document.querySelector("#pop_up .status").textContent = "This student is not a prefect.";
  }

  // ----- Show bloodstatus
  document.querySelector("#pop_up .bloodType").textContent = "Blood type:" + " " + student.bloodType;

  // ----- Show if student is a part of the inquisitorial squad
  if (student.inquisitorial === true) {
    document.querySelector("#pop_up .inquisitorial_squad").textContent = student.firstName + " is a member of the inquisitorial squad";
  } else if (student.prefect === false) {
    document.querySelector("#pop_up .inquisitorial_squad").textContent = student.firstName + " is a not member of the inquisitorial squad";
  }
}

function closePopUp() {
  document.querySelector("#pop_up").classList.add("hide");
}

// ________ SINGLE VIEW POPUP ________
// function showStudentDetails() {}

// -------- !! NON-REVERSIBLE FUNCTIONS !! --------
function expelStudent() {}
function hackTheSystem() {}
