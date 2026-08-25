import ProjectBoard from '../components/ProjectBoard.jsx'

export default function ProjectsPage({ auth }) {
  return (
    <div className="projects-page">
      <ProjectBoard auth={auth} />
    </div>
  )
}
