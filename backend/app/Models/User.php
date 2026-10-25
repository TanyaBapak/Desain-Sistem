<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_code',
        'name',
        'username',
        'email',
        'nip',
        'password',
        'organization',
        'scope_level',
        'scope_name',
        'province_id',
        'bp3mi_code',
        'district_id',
        'institution_id',
        'employer_id',
        'mfa_enabled',
        'mfa_secret',
        'status',
        'avatar_initials',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'nip',
        'mfa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_enabled' => 'boolean',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles', 'model_id', 'role_id');
    }

    public function canAccessTab(string $tab): bool
    {
        return in_array($tab, self::accessibleTabsForRole($this->roles->first()?->name), true);
    }

    /**
     * @return list<string>
     */
    public static function accessibleTabsForRole(?string $roleName): array
    {
        return match ($roleName) {
            'super_admin' => ['rbac', 'audit'],
            'leadership' => ['dashboard', 'reports'],
            'task_force' => ['dashboard', 'modul-a', 'modul-b', 'modul-c', 'modul-d', 'matching', 'sippmi-monitoring', 'approvals', 'reports'],
            'directorate_admin' => ['dashboard', 'modul-b', 'modul-c', 'matching', 'sippmi-monitoring', 'reports'],
            'province_admin', 'district_admin' => ['modul-a'],
            'bp3mi_admin', 'placement_officer' => ['matching', 'sippmi-monitoring'],
            'institution_admin' => ['modul-a', 'modul-b', 'modul-c', 'sippmi-monitoring'],
            'demand_admin' => ['modul-d'],
            'verifier' => ['modul-a', 'modul-b', 'modul-c', 'modul-d', 'approvals'],
            'training_operator' => ['modul-b', 'sippmi-monitoring'],
            'auditor' => ['reports'],
            default => [],
        };
    }
}
