import JobApplication from "../Model/jobApplicationModel.js";

export const getJobApplications = async (req, res) => {
    try {
      const jobApplications = await JobApplication.find().populate('userId', 'username'); // Populating to get username if needed
      res.status(200).json(jobApplications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching job applications', error });
    }
  };   