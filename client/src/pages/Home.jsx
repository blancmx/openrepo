import GithubHot from '../components/GithubHot.jsx'
import CommunityFeed from '../components/CommunityFeed.jsx'
import ArticleList from './ArticleList.jsx'

export default function Home({ auth }) {
  return (
    <div className="home-layout">
      <div className="home-main">
        <ArticleList auth={auth} />
      </div>
      <aside className="home-aside">
        <GithubHot />
        <CommunityFeed />
      </aside>
    </div>
  )
}
