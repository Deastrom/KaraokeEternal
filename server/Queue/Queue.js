const path = require('path')
const db = require('../lib/Database').db
const sql = require('sqlate')

class Queue {
  /**
   * Get queued items for a given room
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async get (roomId) {
    const result = []
    const entities = {}

    const query = sql`
      SELECT queueId, songId, userId, prevQueueId,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING (songId)
        INNER JOIN paths USING (pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      result.push(row.queueId)
      entities[row.queueId] = row
      entities[row.queueId].mediaType = this.getType(row.relPath)

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred
    }

    return { result, entities }
  }

  /**
   * Get media type from file extension
   * @param  {string} file filename
   * @return {string}      player component
   */
  static getType (file) {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

module.exports = Queue
