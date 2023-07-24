import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const ProductSchema = new Schema({
  productName: {
    type: String,
  },
  productDescription: {
    type: String,
  },
  productPrice: {
    type: Number,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});


export const JobSchema = new Schema({
  linkedinId: {
    type: String,
  },
  title: {
    type: String,
  },
  jobDescription: {
    type: String,
  },
  employmentType: {
    type: String,
  },
  jobUrl: {
    type: String,
  },
});

export const CandidateSchema = new Schema({
  linkedinCandId: {
    type: String,
  },
  fullName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  jobId: {
    type: String,
  }
});