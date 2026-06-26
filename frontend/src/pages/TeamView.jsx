import { useState } from 'react';
import { apiFetch } from '../utils/api';

function TeamView({ activeWorkspace }) {
  const [inviteEmail, setInviteEmail] = useState('');
  
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    await apiFetch(`/api/workspaces/${activeWorkspace._id}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail })
    });
    setInviteEmail('');
    alert('User invited!');
  };

  if (!activeWorkspace) {
      return (
          <div className="px-16 py-12">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Select a workspace to manage team members.</h2>
          </div>
      );
  }

  return (
    <div className="flex-1 w-full px-16 py-12">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Team Directory</h1>
        <p className="mb-12 text-lg text-muted-foreground">Manage members of {activeWorkspace.name}</p>

        <div className="flex gap-8">
            <div className="flex-[2]">
                <div className="p-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Workspace Members</h3>
                    <div className="flex flex-col gap-3">
                        {activeWorkspace.members && activeWorkspace.members.map(member => (
                            <div key={member._id} className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20">
                                <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-primary/10 text-primary">
                                    {(member.name || member.email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{member.name || member.email}</p>
                                    <p className="text-sm text-muted-foreground">{member._id === activeWorkspace.ownerId ? 'Workspace Owner' : 'Member'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeWorkspace.pendingInvites && activeWorkspace.pendingInvites.length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-semibold tracking-tight text-muted-foreground">Pending Invites</h3>
                            <div className="flex flex-col gap-3">
                                {activeWorkspace.pendingInvites.map(invitee => (
                                    <div key={invitee._id} className="flex items-center gap-4 p-4 border border-dashed rounded-xl opacity-70">
                                        <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-muted text-muted-foreground">
                                            {(invitee.name || invitee.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{invitee.name || invitee.email}</p>
                                            <p className="text-sm text-muted-foreground">Invited</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <div className="p-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
                    <h3 className="mb-4 text-xl font-semibold tracking-tight">Invite Teammate</h3>
                    <p className="mb-6 text-sm text-muted-foreground">Add a coworker to <strong className="font-medium text-foreground">{activeWorkspace.name}</strong>.</p>
                    <form onSubmit={handleInvite} className="flex flex-col gap-4">
                        <input type="email" placeholder="Email address" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                        <button type="submit" className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-md shadow hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">Send Invite</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
}

export default TeamView;
