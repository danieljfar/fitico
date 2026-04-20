import { asyncHandler } from '../utils/asyncHandler.js';
import { listClasses, listFeaturedInstructorsByOccupancy } from '../services/classService.js';

export const getClasses = asyncHandler(async (req, res) => {
  const classes = await listClasses();
  res.json({ classes });
});

export const getFeaturedInstructors = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 4);
  const instructors = await listFeaturedInstructorsByOccupancy(limit);
  res.json({ instructors });
});