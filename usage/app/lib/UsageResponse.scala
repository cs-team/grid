package model

import java.net.URI
import com.gu.mediaservice.lib.argo.ArgoHelpers
import com.gu.mediaservice.model.Usage
import lib.UsageBuilder

object UsageResponse extends ArgoHelpers {
  private def respondUsageCollection(uri: Option[URI], usages: Set[MediaUsage]) = {
    val flatUsages = usages.groupBy(_.grouping).flatMap { case (grouping, groupedUsages) => {
      val publishedUsage = groupedUsages.find(_.status match {
        case _: PublishedUsageStatus => true
        case _ => false
      })

      val mergedUsages = if (publishedUsage.isEmpty) {
          groupedUsages.headOption
        } else {
          publishedUsage
        }

      mergedUsages.filter(_.isRemoved)

    }}.toList

    respondCollection[Usage](
      uri = uri,
      data = flatUsages.map(UsageBuilder.build)
    )
  }

  def build(usages: Set[MediaUsage], uri: Option[URI] = None) = if(usages.isEmpty) {
    respondNotFound("No usages found.")
  } else {
    respondUsageCollection(uri, usages)
  }
}
