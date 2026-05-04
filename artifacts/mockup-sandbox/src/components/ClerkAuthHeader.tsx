import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

export default function ClerkAuthHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <span className="font-semibold text-gray-900 text-lg">LaunchVibe</span>
      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton afterSignOutUrl="/" />
        </Show>
      </div>
    </header>
  );
}
