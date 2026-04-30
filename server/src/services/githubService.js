/**
 * Service to fetch repository contents from GitHub
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Parses a GitHub URL to get owner and repo name
 * @param {string} url 
 * @returns {{owner: string, repo: string} | null}
 */
function parseGitHubUrl(url) {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    if (parts.length < 2) return null;
    const repo = parts.pop();
    const owner = parts.pop();
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch (e) {
    return null;
  }
}

/**
 * Recursively fetches contents of a GitHub repository
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} path 
 * @returns {Promise<Object>} Map of filename to content
 */
async function fetchRepoContents(owner, repo, path = '') {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Exam-Portal-Service',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const items = await response.json();
  const files = {};

  for (const item of items) {
    if (item.type === 'file') {
      // Filter out common binary files and large files
      const isBinary = /\.(jpg|jpeg|png|gif|zip|exe|pdf|bin|obj|dll|so)$/i.test(item.name);
      if (isBinary || item.size > 500000) continue;

      const fileResponse = await fetch(item.download_url);
      if (fileResponse.ok) {
        files[item.path] = await fileResponse.text();
      }
    } else if (item.type === 'dir') {
      const subFiles = await fetchRepoContents(owner, repo, item.path);
      Object.assign(files, subFiles);
    }
  }

  return files;
}

module.exports = {
  parseGitHubUrl,
  fetchRepoContents
};
