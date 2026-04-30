/**
 * Service to fetch repository contents from GitHub
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Parses a GitHub URL to get owner and repo name
 * @param {string} url 
 * @returns {{owner: string, repo: string, path: string} | null}
 */
function parseGitHubUrl(url) {
  try {
    // Handle formats like:
    // https://github.com/owner/repo
    // https://github.com/owner/repo/tree/main/subdir
    const cleanUrl = url.replace(/https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    
    if (parts.length < 2) return null;
    
    const owner = parts[0];
    const repo = parts[1];
    let path = '';
    
    // Check if it's a deep link (e.g., /tree/main/subdir)
    if (parts.length > 4 && parts[2] === 'tree') {
      path = parts.slice(4).join('/');
    }
    
    return { owner, repo, path };
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
  console.log(`[GitHub API] Requesting contents for ${owner}/${repo} at path: "${path}"`);
  
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Exam-Portal-Service',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[GitHub API] Error ${response.status}: ${errText}`);
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const items = await response.json();
  const files = {};

  // If items is not an array, it's a single file (not a directory)
  const itemsList = Array.isArray(items) ? items : [items];

  for (const item of itemsList) {
    if (item.type === 'file') {
      // Filter out binary and large files
      const isBinary = /\.(jpg|jpeg|png|gif|zip|exe|pdf|bin|obj|dll|so|o|pyc)$/i.test(item.name);
      if (isBinary || item.size > 1000000) {
        console.log(`[GitHub API] Skipping binary/large file: ${item.path}`);
        continue;
      }

      console.log(`[GitHub API] Fetching file: ${item.path}`);
      const fileResponse = await fetch(item.download_url);
      if (fileResponse.ok) {
        // Keep the relative path from the requested root
        const relativePath = path ? item.path.replace(new RegExp(`^${path}/`), '') : item.path;
        files[relativePath] = await fileResponse.text();
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
