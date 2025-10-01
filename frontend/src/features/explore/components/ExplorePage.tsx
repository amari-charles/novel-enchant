/**
 * Explore Page Component
 * Coming Soon page that encourages users to publish their stories
 */

import React from 'react';

export const ExplorePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Explore is Coming Soon
        </h1>

        {/* Subheading */}
        <p className="text-xl text-muted-foreground mb-8">
          Please come back soon to discover amazing published works from our community
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-border w-24"></div>
          <div className="mx-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="h-px bg-border w-24"></div>
        </div>

        {/* Call to Action */}
        <div className="bg-muted rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Want to see this feature sooner?
          </h2>
          <p className="text-muted-foreground mb-4">
            Help us build our library by publishing your enhanced stories! The more stories our community shares,
            the faster we can launch the Explore feature with amazing content for everyone to enjoy.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Enhancing Your Story
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Curated Collections</h3>
            <p className="text-sm text-muted-foreground">
              Browse hand-picked collections of enhanced stories across genres
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Community Favorites</h3>
            <p className="text-sm text-muted-foreground">
              Discover the most loved stories as voted by our readers
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Trending Now</h3>
            <p className="text-sm text-muted-foreground">
              Find what's popular in real-time across all categories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;