import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT;

const API_URL = `${API_HOST}${API_PORT ? `:${API_PORT}` : ''}`;

const App = () => {
  const [students, setStudents] = useState([
    {
      name: "John Doe",
      email: "john.doe@example.com",
      dob: "2000-01-15",
      gender: "Male",
    },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    gender: "",
  });

  // Fetch registered students
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/getStudents`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  // import at top

const handleSubmit = async (e) => {
  e.preventDefault();

  // Use toast.promise
  toast.promise(
    fetch(`${API_URL}/addStudent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }),
    {
      loading: 'Saving student...',
      success: <b>Student registered successfully!</b>,
      error: <b>Could not register student.</b>,
    }
  ).then(() => {
    setFormData({ name: "", email: "", dob: "", gender: "" });
    fetchStudents(); // Refresh list after success
  });
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 flex gap-10 justify-center items-center ">
      {/* Form Card */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md mb-8">
        <img
          src="../public/Ostad.png"
          alt="Logo"
          className="w-24 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-center text-yellow-500 mb-8">
          Register Student
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-start">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-start">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-start">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-start">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          {/* Submit Button */}
          <div>
            <Toaster position="top-center" reverseOrder={false} />
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-xl transition duration-300"
            >
              Register
            </button>
          </div>
        </form>
      </div>

      {/* Registered Students List */}
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-4xl h-[42rem]">
        <h2 className="text-2xl font-bold text-yellow-500 mb-6 text-center">
          Registered Students
        </h2>

        {students.length === 0 ? (
          <p className="text-gray-500 text-center">
            No students registered yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Name</th>
                  <th className="border-b p-2">Email</th>
                  <th className="border-b p-2">Date of Birth</th>
                  <th className="border-b p-2">Gender</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-yellow-50 rounded-2xl">
                    <td className="border-b p-2 flex  items-center gap-5">
                      <span>
                        <img
                          src="../public/OstadCircle.png"
                          alt="logo"
                          className="h-5 w-5"
                        />
                      </span>
                      {student.name}
                    </td>
                    <td className="border-b p-2">{student.email}</td>
                    <td className="border-b p-2">{student.dob}</td>
                    <td className="border-b p-2">{student.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
