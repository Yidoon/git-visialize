import * as fs from 'fs'
import {
  EXCLUD_RANK_FILE_NAME_CODE_LINE,
  TMP_REPO_DIR,
  EXCLUD_RANK_FILE_CODE_LINE_EXTENSION,
} from 'src/config'
import gitPull from 'src/lib/git/gitpull'
import gitClone from '../lib/git/gitclone'
import * as dayjs from 'dayjs'
import { exec } from 'child_process'
import * as nodejieba from 'nodejieba'
import latestPull from 'src/lib/cache/latest-pull'

export const parseGitUrl = (gitUrl: string) => {
  const _isSsh = gitUrl.indexOf('git@') > -1
  const _isHttp = gitUrl.indexOf('http://') > -1 || gitUrl.indexOf('https://') > -1
  const urlType = _isSsh ? 'ssh' : _isHttp ? 'http' : ''
  let repo: string = ''
  let owner: string = ''
  repo = gitUrl.replace(/^.*\/([^/]+)\/?.*$/, '$1')
  repo = repo.split('.')[0]
  if (urlType === 'ssh') {
    owner = gitUrl.match(/:(.*)\//)[1]
  }
  if (urlType === 'http') {
    owner = gitUrl.match(/https:\/\/github.com\/(.*)\//)[1]
  }
  return {
    repo: repo,
    owner: owner,
    protocol: urlType,
    url: gitUrl,
    uname: `${owner}@${repo}`,
  }
}

export const isFolderExist = (folderPath: string): Promise<boolean> => {
  if (!folderPath) {
    return Promise.resolve(false)
  }
  return new Promise<boolean>((resolve, reject) => {
    fs.stat(folderPath, (err, stats) => {
      if (err) {
        resolve(false)
      } else {
        resolve(stats.isDirectory())
      }
    })
  })
}
export const isFileExist = (filePath: string): boolean => {
  if (!filePath) {
    return false
  }
  return fs.existsSync(filePath)
}
/**
 * return repo path in local tmp folder,if not exist,clone it
 * @param githubRepoUrl github repo url
 * @param pull git pull
 * @returns
 */
export const getPathInTmp = async (githubRepoUrl: string, pull = true) => {
  const { uname } = parseGitUrl(githubRepoUrl)
  let targetPath = `${TMP_REPO_DIR}/${uname}`

  const isExit = await isFolderExist(targetPath)

  const latestPullTime = latestPull.get(githubRepoUrl)?.updated_time
  const hasPassOneDay = latestPullTime && dayjs().unix() - latestPullTime > 60 * 60 * 24

  if (isExit) {
    const labelTime = `gitPull_${+new Date()}`
    console.time(labelTime)
    if (pull && hasPassOneDay) {
      await gitPull(targetPath)
      latestPull.refresh(githubRepoUrl)
    }
    console.timeEnd(labelTime)
    return targetPath
  } else {
    targetPath = await gitClone(githubRepoUrl)
  }
  return targetPath
}
export const getRepoPlatform = (url: string) => {
  const isGithub = url.indexOf('github.com') > -1
  const isGitlab = url.indexOf('gitlab') > -1
  if (isGithub) {
    return 'github'
  }
  if (isGitlab) {
    return 'gitlab'
  }
  return ''
}
/**
 * Return the time for each day of the week
 */
export const getEachDayDateUnix = (dateRangeType: 'week' | 'month'): number[] => {
  const dateArr = []
  const DATE_RANGE_COUNT = {
    week: 7,
    month: 30,
  }
  const startOfWeek = dayjs().startOf(dateRangeType)
  for (let i = 0; i < DATE_RANGE_COUNT[dateRangeType]; i++) {
    dateArr.push(startOfWeek.add(i, 'day').unix())
  }
  return dateArr
}
/**
 *
 * @param n
 * @returns the time for each day of last n day
 */
export const getLasyNDayDateUnix = (n: number): number[] => {
  let dateArr = []
  for (let i = n; i >= 0; i--) {
    dateArr.push(dayjs().subtract(i, 'day').unix())
  }
  return dateArr
}
/**
 * wrap exec with promise
 * @param cmd commant
 * @param options exec options
 * @returns
 */
export const execCommand = (cmd: string, options?: any) => {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve(stdout)
    })
  })
}

/**
 * return the start and end date(unix) of spec yaer ,default return current year
 * @param year year
 */
export const getStartEndDateOfYear = (year?: number) => {
  const _year = year || dayjs().year()
  const startDate = dayjs(`${_year}-01-01 00:00:00`).unix()
  const endDate = dayjs(`${_year}-12-31 23:59:59`).unix()
  return {
    startDate,
    endDate,
  }
}

export const filterExcludesFilesByName = (
  source: string[],
  filesName: string[],
): string[] => {
  return source.filter((fileName) => {
    return !filesName.includes(fileName)
  })
}
export const filterExcludesFilesByExtension = (
  source: string[],
  extensions: string[],
): string[] => {
  return source.filter((file) => {
    return !extensions.includes(file.split('.').pop())
  })
}
export const filterFiles = (source) => {
  let resArr = filterExcludesFilesByExtension(
    source,
    EXCLUD_RANK_FILE_CODE_LINE_EXTENSION,
  )
  resArr = filterExcludesFilesByName(resArr, EXCLUD_RANK_FILE_NAME_CODE_LINE)
  return resArr
}
export const getFilesExtensions = (fileName: string): string => {
  return fileName.split('.').pop()
}

export const splitCommitMsg = (msg) => {
  // 特殊字符
  const specialStringPattern =
    /[~!@#$%^&*()_\-+=`\[\]{}|\\;:'",<.>\/?～！@¥（）——「」【】、；：‘“”’《》，。？]+/g
  // 英文字符
  const enPattern = /\w+/g
  // 非英文字符
  const notEnPattern = /[^a-zA-Z]+/g
  const data = new Map()
  msg = msg.replace(specialStringPattern, ' ')
  // 对英文单词进行分割
  const en = msg.replace(notEnPattern, ' ').trim().split(' ')
  const notEn = msg.replace(enPattern, ' ').trim()
  const word = nodejieba.cut(notEn)

  en.forEach((item) => {
    if (!item) return
    data.set(item, data.get(item) + 1 || 1)
  })
  word.forEach((item) => {
    if (!item.trim()) return

    data.set(item, data.get(item) + 1 || 1)
  })

  return data
}

/**
 * @description 合并两个关键词的对象
 */
export const mergeSplitData = (baseData, addData) => {
  baseData = baseData || new Map()

  for (let [key, value] of addData) {
    const baseValue = baseData.get(key) || 0
    baseData.set(key, baseValue + addData.get(key))
  }

  return baseData
}

/**
 * @param birth the birth date of repo
 * @returns
 */
export const calcRepoAge = (birth: number) => {
  const cur = dayjs().unix()
  const past = dayjs(birth).unix()
  const diffTime = cur - past
  const year = Math.floor(diffTime / (86400 * 365))
  const day = Math.floor(diffTime / 86400 - year * 365)
  return `${year} year ${day} day`
}

export const getYearUntilNow = (start: number): number[] => {
  const startYear = dayjs(start).year()

  const curYear = dayjs().year()
  const res = []
  for (let i = startYear; i <= curYear; i++) {
    res.push(dayjs().year(i).unix())
  }
  return res
}

/**
 * return 12 month unix of spec year
 * @param year
 */
export const getMonthsOfYear = (year: number) => {
  const _year = year || dayjs().year()
  const startYearUnix = dayjs().year(_year).startOf('year')
  const res = []
  for (let i = 0, len = 12; i < len; i++) {
    res.push(dayjs(startYearUnix).add(i, 'month').unix())
  }
  return res
}
