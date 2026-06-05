'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'

const SCHOOL = 'Shivalik Public School'

// Kit photos — replace null with '/kit-photos/class-1.jpg' etc after you take photos
// Recommended: flat-lay photo of all books + stationery spread out
const kitPhotos: Record<number, string | null> = {
  1: null, 2: null, 3: null, 4: null, 5: null,
  6: null, 7: null, 8: null, 9: null, 10: null,
}

// Per-item product photos — keyed by exact item name. Fill with real URLs as you photograph them.
// e.g. 'Mridang - 1': '/products/mridang-1.jpg'
const itemPhotos: Record<string, string> = {}
function getItemPhoto(name: string): string | null {
  return itemPhotos[name] || null
}

const kits: Record<number, {
  ncert: { name: string; price: number }[]
  pvt: { name: string; price: number }[]
  notebooks: { name: string; unitPrice: number; qty: number }[]
  stationery: { name: string; price: number }[]
}> = {
  1: {
    ncert: [
      { name: 'Mridang - 1', price: 85 },
      { name: 'Joyful Maths - 1', price: 85 },
    ],
    pvt: [
      { name: 'Grammar Way - 1', price: 299 },
      { name: 'Joyful Maths Workbook - 1', price: 229 },
      { name: 'Bhasha Setu Praveshika', price: 340 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Square-Lined Notebooks (half inch)', unitPrice: 62, qty: 2 },
      { name: 'Five-Lined Notebooks', unitPrice: 62, qty: 2 },
    ],
    stationery: [
      { name: 'Drawing File (spiral binded)', price: 90 },
      { name: 'Drawing Sheets - 1 packet', price: 30 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Clay', price: 60 },
      { name: 'Slate', price: 80 },
      { name: 'Duster', price: 20 },
      { name: 'Pastel Sheets - 1 packet', price: 65 },
      { name: 'Fevicol', price: 60 },
      { name: 'Ice Cream Sticks - 1 packet', price: 40 },
      { name: 'Fevistick', price: 25 },
      { name: 'Pencil Colours', price: 35 },
    ],
  },
  2: {
    ncert: [
      { name: 'Mridang - 2', price: 85 },
      { name: 'Joyful Maths - 2', price: 85 },
      { name: 'Sarangi - 2', price: 85 },
    ],
    pvt: [
      { name: 'Grammar Way - 2', price: 319 },
      { name: 'Joyful Maths Workbook - 2', price: 239 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Square-Lined Notebooks (half inch)', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 2 },
    ],
    stationery: [
      { name: 'Drawing File (spiral binded)', price: 90 },
      { name: 'Drawing Sheets - 1 packet', price: 30 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Clay', price: 60 },
      { name: 'Slate', price: 80 },
      { name: 'Duster', price: 20 },
      { name: 'Pastel Sheets - 1 packet', price: 65 },
      { name: 'Fevicol', price: 60 },
      { name: 'Ice Cream Sticks - 1 packet', price: 40 },
      { name: 'Fevistick', price: 25 },
      { name: 'Pencil Colours', price: 35 },
    ],
  },
  3: {
    ncert: [
      { name: 'Santoor - 3', price: 85 },
      { name: 'Math Mela - 3', price: 85 },
      { name: 'Veena - 3', price: 85 },
      { name: 'Our Wondrous World - 4', price: 85 },
      { name: 'Bansuri', price: 85 },
      { name: 'Khel Yoga', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 3', price: 290 },
      { name: 'Sugam Hindi Vyakaran - 3', price: 405 },
      { name: 'Our Wondrous Workbook - 3', price: 160 },
      { name: 'ACCEL-AI & Coding - 3', price: 545 },
      { name: 'Math Mela Workbook - 3', price: 239 },
      { name: 'Parvaz Punjabi - 0', price: 325 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 6 },
      { name: 'Four-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Square-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
    ],
  },
  4: {
    ncert: [
      { name: 'Santoor - 3', price: 85 },
      { name: 'Math Mela - 3', price: 85 },
      { name: 'Veena - 3', price: 85 },
      { name: 'Our Wondrous World - 4', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 4', price: 320 },
      { name: 'Sugam Hindi Vyakaran - 4', price: 445 },
      { name: 'Our Wondrous Workbook - 4', price: 180 },
      { name: 'ACCEL-AI & Coding - 4', price: 545 },
      { name: 'Parvaz Punjabi - 1', price: 355 },
      { name: 'Knowledge Connect - 4', price: 280 },
      { name: 'My Moral Values - 4', price: 240 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 6 },
      { name: 'Four-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Square-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
    ],
  },
  5: {
    ncert: [
      { name: 'Santoor - 5', price: 85 },
      { name: 'Math Mela - 5', price: 85 },
      { name: 'Veena - 5', price: 85 },
      { name: 'Our Wondrous World - 5', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 5', price: 425 },
      { name: 'Sugam Hindi Vyakaran - 5', price: 465 },
      { name: 'Our Wondrous Workbook - 5', price: 180 },
      { name: 'ACCEL-AI & Coding - 5', price: 545 },
      { name: 'Math Mela Workbook - 5', price: 269 },
      { name: 'Parvaz Punjabi - 2', price: 360 },
      { name: 'Knowledge Connect - 5', price: 300 },
      { name: 'My Moral Values - 5', price: 250 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 11 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
    ],
  },
  6: {
    ncert: [
      { name: 'Poorvi', price: 85 },
      { name: 'Ganita Prakash Math - 6', price: 85 },
      { name: 'Malhar', price: 85 },
      { name: 'Exploring Society India', price: 85 },
      { name: 'Curiosity', price: 85 },
      { name: 'Punjabi Path Pustak - 6', price: 66 },
    ],
    pvt: [
      { name: 'BBC Compacta Basic - 6', price: 532 },
      { name: 'Pratham Hindi Vyakaran - 6', price: 512 },
      { name: 'Knowledge Connect - 6', price: 305 },
      { name: 'My Moral Values - 6', price: 260 },
      { name: 'Byte Code - 6', price: 515 },
      { name: 'Ganita Prakash Workbook - 6', price: 249 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  7: {
    ncert: [
      { name: 'Poorvi - 7', price: 85 },
      { name: 'Ganita Prakash Math - 7 (Part 1)', price: 85 },
      { name: 'Ganita Prakash Math - 7 (Part 2)', price: 85 },
      { name: 'Malhar - 7', price: 85 },
      { name: 'Exploring Society - 7 (Part 1)', price: 85 },
      { name: 'Exploring Society - 7 (Part 2)', price: 85 },
      { name: 'Curiosity - 7', price: 85 },
      { name: 'Punjabi Path Pustak - 7', price: 87 },
      { name: 'Bikhre Phool', price: 125 },
      { name: 'Shivalik Punjabi Grammar', price: 220 },
    ],
    pvt: [
      { name: 'Pratham Hindi Vyakaran - 7', price: 524 },
      { name: 'Knowledge Connect - 7', price: 315 },
      { name: 'My Moral Values - 7', price: 270 },
      { name: 'Byte Code - 7', price: 530 },
      { name: 'BBC Compacta Basic - 7', price: 532 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  8: {
    ncert: [
      { name: 'Poorvi - 8', price: 85 },
      { name: 'Ganita Prakash Math - 8 (Part 1)', price: 85 },
      { name: 'Ganita Prakash Math - 8 (Part 2)', price: 85 },
      { name: 'Malhar - 8', price: 85 },
      { name: 'Exploring Society - 8 (Part 1)', price: 85 },
      { name: 'Curiosity - 8', price: 85 },
      { name: 'Punjabi Path Pustak - 8', price: 87 },
      { name: 'Akashdeep', price: 125 },
    ],
    pvt: [
      { name: 'BBC Compacta Basic - 8', price: 532 },
      { name: 'Pratham Hindi Vyakaran - 8', price: 580 },
      { name: 'Knowledge Connect - 8', price: 320 },
      { name: 'My Moral Values - 8', price: 280 },
      { name: 'Byte Code - 8', price: 545 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  9: {
    ncert: [
      { name: 'Beehive', price: 105 },
      { name: 'Moments', price: 70 },
      { name: 'Words & Expression - 1', price: 165 },
      { name: 'Math - 9', price: 130 },
      { name: 'Sparsh - 1', price: 75 },
      { name: 'Sanchyan - 1', price: 50 },
      { name: 'Democratic Pol. - 1', price: 120 },
      { name: 'Contemporary India - 1', price: 90 },
      { name: 'Economics - 9', price: 85 },
      { name: 'India and Conte. World - 1', price: 145 },
      { name: 'A- Employability Skill - 9', price: 225 },
      { name: 'Science - 9', price: 175 },
    ],
    pvt: [
      { name: 'Punjabi Grammar - 9&10', price: 565 },
      { name: 'Lab Manual Science - 9', price: 415 },
      { name: 'Activity and Project - 9', price: 164 },
      { name: 'Vyakaran - B - 9&10', price: 529 },
    ],
    notebooks: [
      { name: 'Registers (11")', unitPrice: 110, qty: 11 },
      { name: 'Single Line Unit Test Notebooks', unitPrice: 62, qty: 7 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual', price: 85 },
    ],
  },
  10: {
    ncert: [
      { name: 'First Flight', price: 95 },
      { name: 'Footprints without Feet', price: 60 },
      { name: 'Words & Expression - 2', price: 195 },
      { name: 'Math - 10', price: 145 },
      { name: 'Sparsh - 2', price: 90 },
      { name: 'Sanchyan - 2', price: 55 },
      { name: 'Democratic Pol. - 2', price: 85 },
      { name: 'Contemporary India - 2', price: 95 },
      { name: 'Economics - 10', price: 100 },
      { name: 'India and Conte. World - 2', price: 125 },
      { name: 'Science - 10', price: 180 },
      { name: 'B- Data Entry - 10', price: 215 },
      { name: 'A- Employability Skill - 10', price: 170 },
    ],
    pvt: [
      { name: 'Lab Manual Science - 10', price: 415 },
      { name: 'Activity and Project - 10', price: 164 },
    ],
    notebooks: [
      { name: 'Registers (11")', unitPrice: 110, qty: 11 },
      { name: 'Single Line Unit Test Notebooks', unitPrice: 62, qty: 7 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual', price: 85 },
    ],
  },
}

type Section = 'ncert' | 'pvt' | 'notebooks' | 'stationery'

const sectionLabels: Record<Section, { label: string; emoji: string; color: string; bg: string; border: string; illoColor: string }> = {
  ncert:      { label: 'NCERT Books',    emoji: '📗', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8', illoColor: '#1D9E75' },
  pvt:        { label: 'Private Books',  emoji: '📘', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', illoColor: '#3B82F6' },
  notebooks:  { label: 'Notebooks',      emoji: '📓', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', illoColor: '#F59E0B' },
  stationery: { label: 'Stationery',     emoji: '✏️', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', illoColor: '#8B5CF6' },
}

// SVG illustrations for each section header
function BooksIllo({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="10" height="28" rx="2" fill={color} opacity="0.9"/>
      <rect x="7" y="10" width="2" height="28" fill="white" opacity="0.2"/>
      <rect x="18" y="14" width="10" height="24" rx="2" fill={color} opacity="0.7"/>
      <rect x="19" y="14" width="2" height="24" fill="white" opacity="0.2"/>
      <rect x="30" y="8" width="12" height="30" rx="2" fill={color} opacity="0.85"/>
      <rect x="31" y="8" width="2" height="30" fill="white" opacity="0.2"/>
      <line x1="8" y1="22" x2="14" y2="22" stroke="white" strokeWidth="1" opacity="0.3"/>
      <line x1="8" y1="26" x2="14" y2="26" stroke="white" strokeWidth="1" opacity="0.3"/>
      <line x1="32" y1="18" x2="40" y2="18" stroke="white" strokeWidth="1" opacity="0.3"/>
      <line x1="32" y1="22" x2="40" y2="22" stroke="white" strokeWidth="1" opacity="0.3"/>
    </svg>
  )
}

function PvtBooksIllo({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="24" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <rect x="8" y="8" width="32" height="6" rx="2" fill={color} opacity="0.7"/>
      <line x1="12" y1="20" x2="36" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="12" y1="24" x2="30" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="12" y1="28" x2="33" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <rect x="14" y="34" width="20" height="6" rx="2" fill={color} opacity="0.3"/>
      <text x="24" y="39" textAnchor="middle" fontSize="6" fill={color} fontWeight="bold" opacity="0.8">PRIVATE</text>
    </svg>
  )
}

function NotebookIllo({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="8" width="28" height="32" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <rect x="10" y="8" width="5" height="32" rx="2" fill={color} opacity="0.5"/>
      <circle cx="12.5" cy="16" r="1.5" fill="white"/>
      <circle cx="12.5" cy="24" r="1.5" fill="white"/>
      <circle cx="12.5" cy="32" r="1.5" fill="white"/>
      <line x1="19" y1="16" x2="34" y2="16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="19" y1="20" x2="34" y2="20" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="19" y1="24" x2="34" y2="24" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="19" y1="28" x2="30" y2="28" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="19" y1="32" x2="34" y2="32" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

function StationeryIllo({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Pencil */}
      <rect x="10" y="12" width="6" height="24" rx="1" fill={color} opacity="0.8" transform="rotate(-15 13 24)"/>
      <polygon points="10,36 16,36 13,42" fill={color} opacity="0.6" transform="rotate(-15 13 24)"/>
      <rect x="10" y="12" width="6" height="5" rx="1" fill="white" opacity="0.4" transform="rotate(-15 13 24)"/>
      {/* Ruler */}
      <rect x="22" y="10" width="5" height="28" rx="1" fill={color} opacity="0.5" transform="rotate(10 24 24)"/>
      <line x1="23" y1="14" x2="26" y2="14" stroke="white" strokeWidth="1" opacity="0.5" transform="rotate(10 24 24)"/>
      <line x1="23" y1="18" x2="26" y2="18" stroke="white" strokeWidth="1" opacity="0.5" transform="rotate(10 24 24)"/>
      <line x1="23" y1="22" x2="26" y2="22" stroke="white" strokeWidth="1" opacity="0.5" transform="rotate(10 24 24)"/>
      {/* Eraser */}
      <rect x="32" y="28" width="10" height="8" rx="2" fill={color} opacity="0.6"/>
      <rect x="32" y="28" width="4" height="8" rx="2" fill={color} opacity="0.9"/>
    </svg>
  )
}

// Kit hero photo placeholder SVG
function KitPhotoPlaceholder({ cls }: { cls: number }) {
  const colors = ['#3B82F6', '#8B5CF6', '#1D9E75', '#F59E0B', '#EC4899', '#06B6D4', '#F97316', '#3B82F6', '#8B5CF6', '#1D9E75']
  const c = colors[(cls - 1) % colors.length]
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" fill={c} opacity="0.08"/>
      {/* Decorative books */}
      <rect x="40" y="60" width="28" height="100" rx="4" fill={c} opacity="0.15"/>
      <rect x="42" y="60" width="5" height="100" fill={c} opacity="0.3"/>
      <rect x="75" y="80" width="28" height="80" rx="4" fill={c} opacity="0.12"/>
      <rect x="77" y="80" width="5" height="80" fill={c} opacity="0.25"/>
      <rect x="110" y="50" width="32" height="110" rx="4" fill={c} opacity="0.18"/>
      <rect x="112" y="50" width="6" height="110" fill={c} opacity="0.35"/>
      <rect x="250" y="65" width="28" height="95" rx="4" fill={c} opacity="0.15"/>
      <rect x="252" y="65" width="5" height="95" fill={c} opacity="0.3"/>
      <rect x="285" y="75" width="24" height="85" rx="4" fill={c} opacity="0.12"/>
      <rect x="315" y="55" width="30" height="105" rx="4" fill={c} opacity="0.18"/>
      {/* Center content */}
      <rect x="155" y="75" width="90" height="70" rx="8" fill={c} opacity="0.1" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
      <text x="200" y="105" textAnchor="middle" fontSize="24" fill={c} opacity="0.4">📸</text>
      <text x="200" y="128" textAnchor="middle" fontSize="11" fill={c} opacity="0.5" fontFamily="sans-serif" fontWeight="600">Photo coming soon</text>
      {/* Class badge */}
      <rect x="160" y="170" width="80" height="28" rx="14" fill={c} opacity="0.15"/>
      <text x="200" y="189" textAnchor="middle" fontSize="13" fill={c} opacity="0.7" fontFamily="sans-serif" fontWeight="700">Class {cls} Kit</text>
    </svg>
  )
}

export default function SchoolSetsPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  const [selectedClass, setSelectedClass] = useState<number>(1)
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({ ncert: true, pvt: true, notebooks: true, stationery: true })
  const [checked, setChecked] = useState<Record<Section, boolean[]>>({} as any)
  const [nbQty, setNbQty] = useState<number[]>([])
  const [nbBrand, setNbBrand] = useState<('buddy' | 'classmate')[]>([]) // brand per notebook item
  const [nbRegType, setNbRegType] = useState<('slim' | 'thick')[]>([])  // register variant per item
  const [warnModal, setWarnModal] = useState<{ section: Section; idx: number } | null>(null)
  const [photoExpanded, setPhotoExpanded] = useState(false)
  const [cart, setCart] = useState<{ selectedClass: number; items: string[]; kitSubtotal: number }[]>([])

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('buddybooks_cart')
    if (raw) { try { setCart(JSON.parse(raw)) } catch {} }
  }, [])

  useEffect(() => {
    const kit = kits[selectedClass]
    setChecked({
      ncert: kit.ncert.map(() => true),
      pvt: kit.pvt.map(() => true),
      notebooks: kit.notebooks.map(() => true),
      stationery: kit.stationery.map(() => true),
    })
    setNbQty(kit.notebooks.map(n => n.qty))
    setNbBrand(kit.notebooks.map(() => 'buddy'))
    setNbRegType(kit.notebooks.map(() => 'slim'))
    setPhotoExpanded(false)
  }, [selectedClass])

  const kit = kits[selectedClass]

  function toggleSection(s: Section) {
    setOpenSections(prev => ({ ...prev, [s]: !prev[s] }))
  }

  function handleCheckClick(s: Section, i: number) {
    if (checked[s]?.[i]) {
      setWarnModal({ section: s, idx: i })
    } else {
      setChecked(prev => {
        const arr = [...prev[s]]
        arr[i] = true
        return { ...prev, [s]: arr }
      })
    }
  }

  function confirmUncheck() {
    if (!warnModal) return
    const { section, idx } = warnModal
    setChecked(prev => {
      const arr = [...prev[section]]
      arr[idx] = false
      return { ...prev, [section]: arr }
    })
    setWarnModal(null)
  }

  function toggleAll(s: Section, val: boolean) {
    if (!val) {
      if (!window.confirm('This will remove all ' + sectionLabels[s].label + ' from your kit. These are listed in the official book list. Are you sure?')) return
    }
    setChecked(prev => ({ ...prev, [s]: prev[s].map(() => val) }))
  }

  // ── Notebook pricing ─────────────────────────────────────────────────────
  // Is this item a "register" type? (Class 9/10 have registers)
  function isRegister(name: string) {
    return name.toLowerCase().includes('register')
  }

  // Classmate prices
  // Regular notebook: ₹55
  // Register slim (196 pages): ₹85
  // Register thick (240 pages): ₹105
  // Buddy prices (20% off MRP)
  // Regular notebook MRP ₹62 → Buddy price ₹62 (no discount on regular — sold at MRP)
  // Wait — per user: Buddy notebooks = ₹62 flat (our own brand at ₹62)
  // Register slim MRP ₹85 → Buddy price ₹68 (20% off ₹85)
  // Register thick MRP ₹110 → Buddy price ₹88 (20% off ₹110)
  function nbUnitPrice(i: number) {
    const name = kit.notebooks[i]?.name || ''
    const brand = nbBrand[i] || 'buddy'
    const regType = nbRegType[i] || 'slim'
    if (isRegister(name)) {
      if (brand === 'buddy') return regType === 'slim' ? 68 : 88   // 20% off ₹85 and ₹110
      else return regType === 'slim' ? 85 : 105                     // Classmate
    }
    return brand === 'buddy' ? 50 : 55  // Buddy ₹50 (20% off ₹62 MRP), Classmate ₹55
  }

  function nbBrandLabel(i: number) {
    const name = kit.notebooks[i]?.name || ''
    const brand = nbBrand[i] || 'buddy'
    const regType = nbRegType[i] || 'slim'
    if (isRegister(name)) {
      const pages = brand === 'buddy' ? (regType === 'slim' ? 196 : 240) : (regType === 'slim' ? 196 : 240)
      const mrp = brand === 'buddy' ? (regType === 'slim' ? 85 : 110) : (regType === 'slim' ? 85 : 105)
      return { pages, mrp }
    }
    return { pages: null, mrp: brand === 'buddy' ? 62 : 55 }
  }
  // ─────────────────────────────────────────────────────────────────────────

  function setQty(i: number, val: number) {
    if (val < 0) return
    const recommended = kit.notebooks[i].qty
    if (val > recommended * 2) return
    const newQty = [...nbQty]
    newQty[i] = val
    setNbQty(newQty)
  }

  function calcTotal() {
    if (!checked.ncert) return 0
    let total = 0
    const flatSections: Section[] = ['ncert', 'pvt', 'stationery']
    flatSections.forEach(s => {
      kit[s].forEach((item: any, i: number) => {
        if (checked[s]?.[i]) total += item.price
      })
    })
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i]) total += nbUnitPrice(i) * (nbQty[i] || 0)
    })
    return total
  }

  function getSelectedItems() {
    const items: string[] = []
    const flatSections: Section[] = ['ncert', 'pvt', 'stationery']
    flatSections.forEach(s => {
      kit[s].forEach((item: any, i: number) => {
        if (checked[s]?.[i]) items.push(item.name + ' ₹' + item.price)
      })
    })
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i] && (nbQty[i] || 0) > 0) {
        const brand = nbBrand[i] === 'buddy' ? 'Buddy' : 'Classmate'
        const regType = isRegister(item.name) ? (nbRegType[i] === 'slim' ? ' (196pg)' : nbBrand[i] === 'buddy' ? ' (210pg)' : ' (240pg)') : ''
        items.push(item.name + ' [' + brand + regType + '] x' + nbQty[i] + ' ₹' + (nbUnitPrice(i) * nbQty[i]))
      }
    })
    return items
  }

  function billTotal() {
    const flatSections: Section[] = ['ncert', 'pvt', 'stationery']
    let total = flatSections.reduce((sum, s) => sum + (kit[s] as any[]).reduce((a: number, b: any) => a + b.price, 0), 0)
    // Use default buddy prices for bill total
    kit.notebooks.forEach((n) => {
      const price = isRegister(n.name) ? 68 : 50 // buddy register slim / buddy notebook
      total += price * n.qty
    })
    return total
  }

  const kitSubtotal = calcTotal()
  const bill = billTotal()

  // Market price = what they'd pay buying everything separately at full MRP (no Buddy discount)
  function marketTotal() {
    const flatSections: Section[] = ['ncert', 'pvt', 'stationery']
    let total = 0
    flatSections.forEach(s => {
      kit[s].forEach((item: any, i: number) => {
        if (checked[s]?.[i]) total += item.price
      })
    })
    // Notebooks at Classmate/MRP price (₹55 notebook, register MRP ₹85/₹105)
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i]) {
        const mrp = isRegister(item.name) ? (nbRegType[i] === 'slim' ? 85 : 105) : 55
        total += mrp * (nbQty[i] || 0)
      }
    })
    return total
  }
  const market = marketTotal()
  const youSave = market - kitSubtotal

  function currentKit() {
    return { selectedClass, items: getSelectedItems(), kitSubtotal }
  }

  function handleAddAnotherKit() {
    const newCart = [...cart, currentKit()]
    setCart(newCart)
    sessionStorage.setItem('buddybooks_cart', JSON.stringify(newCart))
    // Move to a different class for the next child
    const usedClasses = newCart.map(k => k.selectedClass)
    const nextClass = [1,2,3,4,5,6,7,8,9,10].find(c => !usedClasses.includes(c)) || 1
    setSelectedClass(nextClass)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleProceedToCheckout() {
    // Bundle current kit + any saved kits
    const allKits = [...cart, currentKit()]
    sessionStorage.setItem('buddybooks_kit_order', JSON.stringify(allKits))
    sessionStorage.removeItem('buddybooks_cart')
    router.push('/checkout')
  }

  // Total across all kits in cart + current
  const cartTotal = cart.reduce((sum, k) => sum + k.kitSubtotal, 0) + kitSubtotal
  const totalKits = cart.length + 1
  const siblingDiscount = totalKits >= 2 ? Math.round(cartTotal * 0.05) : 0
  const cartAfterDiscount = cartTotal - siblingDiscount

  const hasPhoto = !!kitPhotos[selectedClass]

  function warnItemName() {
    if (!warnModal) return ''
    const { section, idx } = warnModal
    if (section === 'notebooks') return kit.notebooks[idx]?.name
    return (kit[section] as any[])[idx]?.name || ''
  }

  const sectionIllos: Record<Section, React.FC<{ color: string }>> = {
    ncert: BooksIllo,
    pvt: PvtBooksIllo,
    notebooks: NotebookIllo,
    stationery: StationeryIllo,
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --border: #E5E2DA;
      --text: #1B2A4A; --text-2: #666; --text-3: #999;
      --green: #1D9E75; --green-dark: #157A5A; --green-bg: #E8F7F2; --green-border: #C0E8D8;
      --shadow: 0 2px 12px rgba(27,42,74,0.07); --shadow-lg: 0 8px 32px rgba(27,42,74,0.12);
      --r: 16px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --border: #2A2D3E;
        --text: #E8E6F0; --text-2: #A0A0B0; --text-3: #666880;
        --green-bg: #0D2B22; --green-border: #1A4035;
        --shadow: 0 2px 12px rgba(0,0,0,0.3); --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
    .k { font-family: 'Kalam', cursive; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
    .class-btn { padding: 8px 0; border-radius: 10px; border: 2px solid var(--border); background: var(--white); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; text-align: center; }
    .class-btn.active { background: var(--green); color: #fff; border-color: var(--green); box-shadow: 0 4px 12px rgba(29,158,117,0.3); }
    .class-btn:hover:not(.active) { border-color: var(--green); color: var(--green); }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; user-select: none; transition: background 0.15s; }
    .section-header:hover { background: var(--bg) !important; }
    .item-row { display: flex; align-items: center; gap: 12px; padding: 10px 18px; transition: background 0.1s; border-bottom: 1px solid var(--border); }
    .item-row:last-child { border-bottom: none; }
    .item-row:hover { background: var(--bg); }
    .prod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 14px; }
    .prod-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.2s, box-shadow 0.2s; position: relative; }
    .prod-card.selected { border-color: #1D9E75; box-shadow: 0 0 0 1px #1D9E75; }
    .prod-card.selected .prod-photo { background: #F0FDF8; }
    .prod-photo { width: 100%; aspect-ratio: 1/1; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; position: relative; border-bottom: 1px solid var(--border); }
    .prod-body { padding: 10px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .prod-name { font-size: 12px; font-weight: 600; color: var(--text); line-height: 1.35; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 32px; }
    .prod-foot { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: auto; }
    .prod-price { font-size: 14px; font-weight: 700; color: var(--text); font-family: 'Kalam', cursive; }
    .add-btn { border: 1.5px solid #1D9E75; background: #E8F7F2; color: #1D9E75; border-radius: 9px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, color 0.15s, box-shadow 0.15s; white-space: nowrap; }
    .add-btn:hover { background: #1D9E75; color: #fff; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(29,158,117,0.3); }
    .add-btn:active { transform: scale(0.88); }
    .add-btn.added { background: #1D9E75; color: #fff; animation: addedPop 0.34s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes addedPop { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 70% { transform: scale(0.94); } 100% { transform: scale(1); } }
    .check-badge { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; background: #1D9E75; display: flex; align-items: center; justify-content: center; animation: badgePop 0.34s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes badgePop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); } }
    @media (min-width: 700px) { .prod-grid { grid-template-columns: repeat(3, 1fr); } }
    .checkbox { width: 18px; height: 18px; border-radius: 5px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; cursor: pointer; }
    .checkbox.checked { background: var(--green); border-color: var(--green); }
    .qty-ctrl { display: flex; align-items: center; gap: 6px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 2px 4px; }
    .qty-btn { width: 24px; height: 24px; border-radius: 6px; border: none; background: var(--white); cursor: pointer; font-size: 15px; font-weight: 700; color: var(--text-2); display: flex; align-items: center; justify-content: center; transition: all 0.1s; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .qty-btn:hover { background: #E8F7F2; color: #1D9E75; }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-num { font-size: 13px; font-weight: 700; color: var(--text); min-width: 22px; text-align: center; }
    .delivery-btn { flex: 1; padding: 10px; border-radius: 10px; border: 2px solid var(--border); background: var(--white); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .delivery-btn.active { border-color: var(--green); background: var(--green-bg); color: var(--green); }
    input[type="text"], textarea { color: var(--text) !important; background: var(--bg) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border 0.15s; }
    input[type="text"]:focus, textarea:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1); }
    .order-btn { width: 100%; background: var(--green); color: #fff; border: none; border-radius: 14px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Kalam', cursive; transition: all 0.2s; box-shadow: 0 6px 20px rgba(29,158,117,0.3); }
    .order-btn:hover { background: var(--green-dark); transform: translateY(-2px); }
    .order-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .sticky-summary { position: sticky; top: 120px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
    .modal-box { background: var(--white); border-radius: 20px; padding: 28px 24px; max-width: 380px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .checkout-modal { background: var(--white); border-radius: 24px; padding: 0; max-width: 420px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.35); overflow: hidden; }
    @keyframes modalPop { from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal-pop { animation: modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
    .pay-opt-btn { width: 100%; border-radius: 14px; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.15s; border: 2px solid var(--border); background: var(--card); text-align: left; font-family: 'DM Sans', sans-serif; }
    .pay-opt-btn:hover { transform: translateY(-2px); }
    .pay-opt-btn.selected-full { border-color: #1D9E75; background: #E8F7F2; box-shadow: 0 4px 16px rgba(29,158,117,0.2); }
    .pay-opt-btn.selected-partial { border-color: #3B82F6; background: #EFF6FF; box-shadow: 0 4px 16px rgba(59,130,246,0.2); }
    .photo-card { border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border); box-shadow: var(--shadow); background: var(--card); margin-bottom: 16px; }
    .photo-card img { width: 100%; height: 220px; object-fit: cover; display: block; }
    .photo-thumb { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .photo-thumb:hover { transform: scale(1.02); box-shadow: var(--shadow-lg); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .slide-down { animation: slideDown 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease; }
    @media (min-width: 900px) { .layout { display: block; } }
    @media (max-width: 640px) { .sticky-summary { position: static !important; } }
    .checkout-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--white); border-top: 1.5px solid var(--border); padding: 14px 20px; z-index: 90; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 16px; }
    .photo-placeholder { background: var(--bg); border: 1.5px dashed var(--border); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all 0.15s; }
    .photo-placeholder:hover { border-color: var(--green); background: var(--green-bg); }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; padding: 12px 18px; background: var(--bg); border-top: 1px solid var(--border); }
  `

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Warning modal */}
      {warnModal && (
        <div className="modal-overlay" onClick={() => setWarnModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>⚠️</div>
            <h3 className="k" style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '10px', textAlign: 'center' }}>Remove from kit?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px', textAlign: 'center' }}>
              <strong style={{ color: 'var(--text)' }}>{warnItemName()}</strong> is in the official Shivalik book list. Remove it?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setWarnModal(null)} style={{ flex: 1, background: 'var(--bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Keep it</button>
              <button onClick={confirmUncheck} style={{ flex: 1, background: '#FEF2F2', color: '#E24B4A', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Yes, remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {photoExpanded && hasPhoto && (
        <div className="modal-overlay" onClick={() => setPhotoExpanded(false)}>
          <div style={{ maxWidth: '700px', width: '100%', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <img src={kitPhotos[selectedClass]!} alt={'Class ' + selectedClass + ' kit'} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Class {selectedClass} Kit — {SCHOOL}</span>
              <button onClick={() => setPhotoExpanded(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Close ×</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <button onClick={() => router.push('/marketplace')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>BuddyBooks</span>
          </div>
          <button onClick={() => router.push('/my-orders')} style={{ marginLeft: 'auto', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>📦 My Orders</button>
        </nav>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #1D9E75 100%)', padding: '28px 20px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>📦 Pre-assembled school kits · Delivery available</span>
            </div>
            <h1 className="k" style={{ fontSize: 'clamp(24px, 5vw, 38px)', color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>School Sets 🎒</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '480px' }}>
              Complete book + stationery kits for {SCHOOL}. All items from the official book list. Customise what you need and order in minutes.
            </p>
          </div>
        </div>

        {/* Class selector */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '16px 20px', position: 'sticky', top: '56px', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Select Class</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(c => (
                <button key={c} className={'class-btn' + (selectedClass === c ? ' active' : '')} onClick={() => setSelectedClass(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 80px' }}>
          <div className="layout">

            {/* LEFT: Kit customizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Kit photo — hero image or illustrated placeholder */}
              <div className={'photo-card photo-thumb fade-in'} onClick={() => hasPhoto && setPhotoExpanded(true)}
                style={{ cursor: hasPhoto ? 'zoom-in' : 'default', position: 'relative' }}>
                {hasPhoto ? (
                  <>
                    <img src={kitPhotos[selectedClass]!} alt={'Class ' + selectedClass + ' complete kit'} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '99px', backdropFilter: 'blur(4px)', fontWeight: '600' }}>🔍 Tap to enlarge</div>
                  </>
                ) : (
                  <div style={{ height: '220px', position: 'relative' }}>
                    <KitPhotoPlaceholder cls={selectedClass} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '11px', padding: '5px 14px', borderRadius: '99px', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      📸 Real photos coming soon
                    </div>
                  </div>
                )}
                {/* Kit info bar */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div>
                    <div className="k" style={{ fontSize: '16px', color: 'var(--text)' }}>Class {selectedClass} Complete Kit</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{SCHOOL} · Official book list</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="k" style={{ fontSize: '20px', color: '#1D9E75' }}>₹{bill.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>full kit value</div>
                  </div>
                </div>
              </div>

              {/* Savings comparison box */}
              {youSave > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #E8F7F2, #EFF6FF)', border: '1.5px solid #C0E8D8', borderRadius: '16px', padding: '16px 18px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Buying separately</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{market.toLocaleString()}</div>
                      </div>
                      <div style={{ fontSize: '18px', color: 'var(--text-3)' }}>→</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', marginBottom: '2px' }}>BuddyBooks kit</div>
                        <div className="k" style={{ fontSize: '20px', color: '#1D9E75', fontWeight: '700' }}>₹{kitSubtotal.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ background: '#1D9E75', borderRadius: '12px', padding: '8px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>You save</div>
                      <div className="k" style={{ fontSize: '20px', color: '#fff', fontWeight: '700' }}>₹{youSave.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(29,158,117,0.15)' }}>
                    <span style={{ fontSize: '12px', color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '5px' }}>⏱️ Saves ~3 hours of market hunting</span>
                    <span style={{ fontSize: '12px', color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '5px' }}>✅ Every book on the official list</span>
                    <span style={{ fontSize: '12px', color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '5px' }}>📦 Assembled & ready</span>
                  </div>
                </div>
              )}

              {/* Section cards with illustrations */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
                <h2 className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>Customise your kit</h2>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Uncheck items you already have</span>
              </div>

              {/* NCERT, PVT, STATIONERY */}
              {(['ncert', 'pvt', 'stationery'] as Section[]).map(s => {
                const sec = sectionLabels[s]
                const items = kit[s] as { name: string; price: number }[]
                const checkedItems = checked[s] || []
                const allChecked = checkedItems.every(Boolean)
                const secTotal = items.reduce((sum, item, i) => sum + (checkedItems[i] ? item.price : 0), 0)
                const isOpen = openSections[s]
                const Illo = sectionIllos[s]
                return (
                  <div key={s} style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid ' + sec.border, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div className="section-header" style={{ background: sec.bg }} onClick={() => toggleSection(s)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Illo color={sec.illoColor} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: sec.color }}>{sec.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{items.length} items · ₹{secTotal.toLocaleString()} selected</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={e => { e.stopPropagation(); toggleAll(s, !allChecked) }}
                          style={{ fontSize: '11px', color: sec.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>
                          {allChecked ? 'Deselect all' : 'Select all'}
                        </button>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                          <path d="M4 6l4 4 4-4" stroke={sec.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="slide-down prod-grid" style={{ borderTop: '1px solid ' + sec.border }}>
                        {items.map((item, i) => {
                          const isAdded = checkedItems[i]
                          const photo = getItemPhoto(item.name)
                          return (
                            <div key={i} className={'prod-card' + (isAdded ? ' selected' : '')}>
                              <div className="prod-photo">
                                {photo ? (
                                  <img src={photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <>
                                    <span style={{ fontSize: '34px' }}>{sec.emoji}</span>
                                    <span style={{ fontSize: '8px', color: 'var(--text-3)', fontWeight: '600' }}>📸 Photo soon</span>
                                  </>
                                )}
                                {isAdded && (
                                  <div className="check-badge">
                                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </div>
                                )}
                              </div>
                              <div className="prod-body">
                                <div className="prod-name">{item.name}</div>
                                <div className="prod-foot">
                                  <span className="prod-price" style={{ color: isAdded ? sec.color : 'var(--text-3)' }}>₹{item.price}</span>
                                  <button className={'add-btn' + (isAdded ? ' added' : '')} onClick={() => handleCheckClick(s, i)}>
                                    {isAdded ? '✓ Added' : 'ADD +'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* NOTEBOOKS with qty + brand selector */}
              {(() => {
                const s: Section = 'notebooks'
                const sec = sectionLabels[s]
                const checkedItems = checked[s] || []
                const isOpen = openSections[s]
                const allChecked = checkedItems.every(Boolean)
                const secTotal = kit.notebooks.reduce((sum, item, i) => sum + (checkedItems[i] ? nbUnitPrice(i) * (nbQty[i] || 0) : 0), 0)
                const Illo = sectionIllos[s]
                return (
                  <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid ' + sec.border, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div className="section-header" style={{ background: sec.bg }} onClick={() => toggleSection(s)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Illo color={sec.illoColor} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: sec.color }}>{sec.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{kit.notebooks.length} types · ₹{secTotal.toLocaleString()} selected</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={e => { e.stopPropagation(); toggleAll(s, !allChecked) }}
                          style={{ fontSize: '11px', color: sec.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>
                          {allChecked ? 'Deselect all' : 'Select all'}
                        </button>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                          <path d="M4 6l4 4 4-4" stroke={sec.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="slide-down" style={{ borderTop: '1px solid ' + sec.border }}>

                        {/* Brand info banner */}
                        <div style={{ background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)', borderBottom: '1px solid #FDE68A', padding: '10px 18px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#1D9E75', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px' }}>BUDDY</div>
                            <span style={{ fontSize: '11px', color: '#92400E', fontWeight: '600' }}>Our brand · 20% OFF MRP</span>
                          </div>
                          <div style={{ width: '1px', height: '16px', background: '#FDE68A' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#3B82F6', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px' }}>CLASSMATE</div>
                            <span style={{ fontSize: '11px', color: '#92400E' }}>Brand notebook · MRP price</span>
                          </div>
                        </div>

                        {kit.notebooks.map((item, i) => {
                          const isChecked = checkedItems[i]
                          const qty = nbQty[i] || 0
                          const recommended = item.qty
                          const brand = nbBrand[i] || 'buddy'
                          const regType = nbRegType[i] || 'slim'
                          const unitPrice = nbUnitPrice(i)
                          const itemTotal = isChecked ? unitPrice * qty : 0
                          const isReg = isRegister(item.name)
                          const { pages, mrp } = nbBrandLabel(i)

                          return (
                            <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                              {/* Top row: photo + checkbox + name + price */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: isChecked ? '12px' : '0' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                  {getItemPhoto(item.name)
                                    ? <img src={getItemPhoto(item.name)!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: '22px' }}>📓</span>}
                                </div>
                                <div className={'checkbox' + (isChecked ? ' checked' : '')} style={{ marginTop: '2px', flexShrink: 0 }}
                                  onClick={() => handleCheckClick(s, i)}>
                                  {isChecked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', color: isChecked ? 'var(--text)' : 'var(--text-3)', fontWeight: isChecked ? '600' : '400', textDecoration: isChecked ? 'none' : 'line-through' }}>{item.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                                    {isReg ? 'Register · ' + (pages ? pages + ' pages' : '') : 'Notebook'}
                                    {' · ₹' + unitPrice + ' each'}
                                    {brand === 'buddy' && <span style={{ color: '#1D9E75', fontWeight: '700', marginLeft: '4px' }}>20% off</span>}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div className="k" style={{ fontSize: '14px', color: isChecked && qty > 0 ? sec.color : 'var(--text-3)' }}>
                                    {isChecked && qty > 0 ? '₹' + itemTotal : '—'}
                                  </div>
                                  {isChecked && qty > 0 && <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{qty} pcs</div>}
                                </div>
                              </div>

                              {isChecked && (
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

                                  {/* Brand toggle */}
                                  <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '180px' }}>
                                    {(['buddy', 'classmate'] as const).map(b => {
                                      const isActive = brand === b
                                      // compute price for this brand option
                                      const tempBrand = b
                                      const optPrice = isReg
                                        ? (tempBrand === 'buddy' ? (regType === 'slim' ? 68 : 88) : (regType === 'slim' ? 85 : 105))
                                        : (tempBrand === 'buddy' ? 50 : 55)
                                      return (
                                        <button key={b} onClick={() => { const arr = [...nbBrand]; arr[i] = b; setNbBrand(arr) }}
                                          style={{ flex: 1, padding: '7px 8px', borderRadius: '10px', border: isActive ? '2px solid ' + (b === 'buddy' ? '#1D9E75' : '#3B82F6') : '1.5px solid var(--border)', background: isActive ? (b === 'buddy' ? '#E8F7F2' : '#EFF6FF') : 'var(--bg)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', textAlign: 'center' }}>
                                          <div style={{ fontSize: '10px', fontWeight: '800', color: isActive ? (b === 'buddy' ? '#1D9E75' : '#3B82F6') : 'var(--text-3)', marginBottom: '2px', textTransform: 'uppercase' }}>{b === 'buddy' ? '⭐ BUDDY' : 'CLASSMATE'}</div>
                                          <div style={{ fontSize: '12px', fontWeight: '700', color: isActive ? (b === 'buddy' ? '#1D9E75' : '#3B82F6') : 'var(--text-2)' }}>₹{optPrice}</div>
                                          {b === 'buddy' && isReg && <div style={{ fontSize: '9px', color: '#1D9E75', fontWeight: '600' }}>20% OFF</div>}
                                          {b === 'buddy' && !isReg && <div style={{ fontSize: '9px', color: '#1D9E75', fontWeight: '600' }}>20% off ₹62</div>}
                                          {b === 'classmate' && <div style={{ fontSize: '9px', color: 'var(--text-3)' }}>MRP ₹{isReg ? (regType === 'slim' ? 85 : 105) : 62}</div>}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {/* Register type picker — only for registers */}
                                  {isReg && (
                                    <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '160px' }}>
                                      {(['slim', 'thick'] as const).map(rt => {
                                        const isRtActive = regType === rt
                                        const rtPages = rt === 'slim' ? 196 : (brand === 'buddy' ? 210 : 240)
                                        const rtMrp = rt === 'slim' ? (brand === 'buddy' ? 68 : 85) : (brand === 'buddy' ? 88 : 105)
                                        return (
                                          <button key={rt} onClick={() => { const arr = [...nbRegType]; arr[i] = rt; setNbRegType(arr) }}
                                            style={{ flex: 1, padding: '7px 8px', borderRadius: '10px', border: isRtActive ? '2px solid #F59E0B' : '1.5px solid var(--border)', background: isRtActive ? '#FFFBEB' : 'var(--bg)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', textAlign: 'center' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '700', color: isRtActive ? '#D97706' : 'var(--text-3)', marginBottom: '2px' }}>{rtPages} pages</div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: isRtActive ? '#D97706' : 'var(--text-2)' }}>₹{rtMrp}</div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}

                                  {/* Qty control */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <div className="qty-ctrl">
                                      <button className="qty-btn" disabled={qty <= 0} onClick={() => setQty(i, qty - 1)}>−</button>
                                      <span className="qty-num" style={{ color: qty > recommended ? '#F59E0B' : qty < recommended ? '#3B82F6' : 'var(--text)' }}>{qty}</span>
                                      <button className="qty-btn" disabled={qty >= recommended * 2} onClick={() => setQty(i, qty + 1)}>+</button>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>of {recommended} listed</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                  Quantities are pre-set from the official book list. Adjust as needed — price updates live.
                </div>
              </div>
            </div>

              {/* Tip */}
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '80px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                  Quantities pre-set from the official book list. Adjust as needed — price updates live. Product photos will appear on each card once uploaded.
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Sibling discount hint banner — shows when cart has kits */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', padding: '8px 20px', zIndex: 91, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#fff', fontWeight: '600' }}>
          🎉 {totalKits} kits in your order · 5% sibling discount applied (−₹{siblingDiscount.toLocaleString()})
        </div>
      )}

      {/* Sticky checkout bar */}
      <div className="checkout-bar">
        <div style={{ flex: 1, minWidth: 0 }}>
          {cart.length > 0 ? (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{totalKits} kits total</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {siblingDiscount > 0 && <span style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{cartTotal.toLocaleString()}</span>}
                <span className="k" style={{ fontSize: '22px', color: '#1D9E75' }}>₹{cartAfterDiscount.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kit subtotal</div>
              <div className="k" style={{ fontSize: '22px', color: '#1D9E75' }}>₹{kitSubtotal.toLocaleString()}</div>
            </>
          )}
        </div>

        {isSignedIn ? (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleAddAnotherKit}
              disabled={kitSubtotal === 0}
              title="Add another child's kit and save 5%"
              style={{ background: '#F5F3FF', color: '#7C3AED', border: '1.5px solid #DDD6FE', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: '700', cursor: kitSubtotal === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', opacity: kitSubtotal === 0 ? 0.5 : 1 }}>
              + Add child
            </button>
            <button
              onClick={handleProceedToCheckout}
              disabled={kitSubtotal === 0 && cart.length === 0}
              style={{ background: 'linear-gradient(135deg, #1D9E75, #157A5A)', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.35)', whiteSpace: 'nowrap' }}>
              Checkout →
            </button>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button style={{ background: 'linear-gradient(135deg, #1D9E75, #157A5A)', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Sign in to order →
            </button>
          </SignInButton>
        )}
      </div>
    </>
  )
}