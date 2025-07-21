# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML website for a "污水治理智能审批系统" (Wastewater Treatment Intelligent Approval System) - an AI-driven environmental compliance solution for wastewater treatment project approvals.

## Project Structure

```
Website/
├── 111.html          # Main landing page (Chinese language)
├── logo.png          # Company/product logo
└── CLAUDE.md         # This file
```

## Architecture

- **Technology**: Pure HTML/CSS/JavaScript static website
- **Language**: Chinese (Simplified)
- **Design**: Single-page application with responsive design
- **Styling**: Embedded CSS with modern gradients and animations
- **JavaScript**: Vanilla JS for form handling and smooth scrolling

## Key Components

### HTML Structure (111.html)
- **Header**: Navigation with logo and menu links
- **Hero Section**: Main landing area with call-to-action buttons
- **Features Section**: Product advantages displayed in a grid layout
- **Pricing Section**: Quote request form for potential customers
- **Trial Section**: Free trial signup area
- **Footer**: Contact information and additional links

### Styling Features
- Modern gradient backgrounds
- Glassmorphism effects with backdrop filters
- Smooth animations and hover effects
- Responsive design for mobile devices
- Feature cards with shimmer effects on hover

### JavaScript Functionality
- Form submission handling for quote requests
- Free trial signup modal
- Smooth scrolling navigation
- Intersection Observer for scroll animations

## Development Guidelines

Since this is a static HTML website with no build process:

- Edit `111.html` directly for content or layout changes
- All CSS is embedded in the `<style>` section of 111.html
- All JavaScript is embedded in the `<script>` section at the bottom of 111.html
- The logo.png file should be maintained in the root directory
- No package.json, build tools, or external dependencies

## Content Notes

The website is designed for a B2B SaaS product targeting:
- Government departments (政府部门)
- Industrial park operators (园区运营方)
- Major polluting enterprises (重点排污企业)
- Environmental consulting companies (环保咨询公司)

## File Encoding

Ensure all Chinese characters are properly encoded in UTF-8 when making edits.