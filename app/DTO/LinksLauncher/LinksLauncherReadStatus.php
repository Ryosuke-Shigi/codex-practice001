<?php

namespace App\DTO\LinksLauncher;

enum LinksLauncherReadStatus
{
    case Available;
    case Unpublished;
    case Missing;
}
