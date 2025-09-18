import { GitHubService } from "./adapters/GitHubService.ts";
import { NotionService } from "./adapters/NotionService.ts";
import { FigmaService } from "./adapters/FigmaService.ts";

export const ToolFactory = (provider: string, accessToken?: string) => {
  switch (provider.toLowerCase()) {
    case "github":
      return new GitHubService(accessToken);
    case "notion":
      return new NotionService(accessToken);
    case "figma":
      return new FigmaService(accessToken);
    default:
      throw new Error("Tool not supported");
  }
};
