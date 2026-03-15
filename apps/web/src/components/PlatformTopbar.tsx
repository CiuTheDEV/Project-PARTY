import { Link } from "react-router-dom";

type PlatformTopbarProps = {
  actionLabel?: string;
  actionHref?: string;
};

export function PlatformTopbar({
  actionLabel = "Dolacz po kodzie",
  actionHref = "/join",
}: PlatformTopbarProps) {
  return (
    <header className="lobby-topbar" aria-label="Naglowek platformy">
      <Link className="lobby-brand" to="/">
        <span className="lobby-brand__mark" aria-hidden="true">
          <span className="material-symbols-outlined">bolt</span>
        </span>
        <span className="lobby-brand__text">Project PARTY</span>
      </Link>

      <Link className="profile-pill" to={actionHref}>
        <span className="profile-pill__avatar" aria-hidden="true">
          <span className="material-symbols-outlined">sports_esports</span>
        </span>
        <span className="profile-pill__name">{actionLabel}</span>
      </Link>
    </header>
  );
}
