const notes = [
    {
        name: "Java Basics",
        course: "CS101",
        description: "Introduction to Java programming",
        date: "2026-07-14",
        time: "10:30 AM",
        file: "sample.pdf"
    },
    {
        name: "Data Structures",
        course: "IT202",
        description: "Stack and Queue notes",
        date: "2026-07-13",
        time: "2:00 PM",
        file: "sample.pdf"
    },
    {
        name: "Calculus",
        course: "MATH301",
        description: "Integration formulas",
        date: "2026-07-12",
        time: "9:00 AM",
        file: "sample.pdf"
    }
];

const container = document.getElementById("notesContainer");

function displayNotes(data) {
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<p>No notes found</p>";
        return;
    }

    data.forEach(note => {
        container.innerHTML += `
        <div class="card">
            <h3>${note.name}</h3>
            <p><b>Course:</b> ${note.course}</p>
            <p><b>Description:</b> ${note.description}</p>
            <p><b>Date:</b> ${note.date}</p>
            <p><b>Time:</b> ${note.time}</p>

            <div class="buttons">
                <a href="${note.file}" target="_blank" class="view">View</a>
                <a href="${note.file}" download class="download">Download</a>
            </div>
        </div>
        `;
    });
}

// Search + Filter
document.getElementById("search").addEventListener("input", filterNotes);
document.getElementById("filter").addEventListener("change", filterNotes);

function filterNotes() {
    const search = document.getElementById("search").value.toLowerCase();
    const filter = document.getElementById("filter").value;

    const filtered = notes.filter(note => {
        return (
            (note.name.toLowerCase().includes(search) ||
             note.course.toLowerCase().includes(search)) &&
            (filter === "" || note.course === filter)
        );
    });

    displayNotes(filtered);
}

displayNotes(notes);
