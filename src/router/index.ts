import repoController from '../controller/repo-controller'
import generalController from '../controller/general-controller'

// export default [...githubRoutes, ...localRoutes]
export default [
  {
    path: '/repo/clone',
    method: 'post',
    action: repoController.clone,
  },
  {
    path: '/general',
    method: 'get',
    action: generalController.getGeneralInfo,
  },
  {
    path: '/repo/info',
    method: 'get',
    action: repoController.getRepo,
  },
  {
    path: '/repo/contributor',
    method: 'get',
    action: repoController.getRepoContributor,
  },
  {
    path: '/repo/file/count',
    method: 'get',
    action: repoController.getFileCount,
  },
  {
    path: '/repo/commit/count',
    method: 'get',
    action: repoController.getCommitCount,
  },
  {
    path: '/repo/code/count',
    method: 'get',
    action: repoController.getCodeCount,
  },
  {
    path: '/stats/commit/trend',
    method: 'get',
    action: repoController.getCommitTrend,
  },
  {
    path: '/stats/commit/trend/month',
    method: 'get',
    action: repoController.getCommitTrendByMonth,
  },
  {
    path: '/stats/commit/trend/contributors',
    method: 'get',
    action: repoController.getContributorsCommitsCount,
  },
  {
    path: '/stats/contributors/trend/code/line',
    method: 'get',
    action: repoController.getContributorCodeLine,
  },
  {
    path: '/rank/file/code_line',
    method: 'get',
    action: repoController.getRankFileRankOfCodeLine,
  },
  {
    path: '/chart/file_category',
    method: 'get',
    action: repoController.getFileCategoryChart,
  },
  {
    path: '/word_cloud',
    method: 'get',
    action: repoController.getWordCloud,
  },
]
