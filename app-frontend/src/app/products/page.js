"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { debounce } from "lodash"; // Install lodash: npm install lodash
import ProductCard from "../../components/ProductCard";
import "../../styles/globals.css";
import { mockFilters } from "../data/mock_data/filters";
import { mockProducts } from "../data/mock_data/products";

const ITEMS_PER_PAGE = 30;

const FilterSidebar = ({ onFilterChange = () => {} }) => {

};

export default FilterSidebar;
