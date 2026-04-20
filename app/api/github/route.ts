import { NextResponse } from "next/server";

const GITHUB_USERNAME = "pujanjoci";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30&type=owner`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "WebOS-Portfolio",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API responded with ${res.status}`);
    }

    const repos = await res.json();

    const simplified = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      homepage: repo.homepage,
      updated: repo.updated_at,
      created: repo.created_at,
      topics: repo.topics || [],
      isForked: repo.fork,
      defaultBranch: repo.default_branch,
      size: repo.size,
      openIssues: repo.open_issues_count,
      license: repo.license?.spdx_id || null,
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
